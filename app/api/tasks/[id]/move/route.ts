import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher-server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { status } = await req.json();
    if (!status) return new NextResponse("Status is required", { status: 400 });

    // Fetch existing task first for permission check
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
      include: { project: { select: { organizationId: true } } }
    });
    if (!existingTask) return new NextResponse("Task not found", { status: 404 });

    // Permission check: regular members can only move tasks assigned to them
    const isOrgAdmin = session.user.role === "OWNER" || session.user.role === "ADMIN";
    if (!isOrgAdmin) {
      const projectMember = await prisma.projectMember.findFirst({
        where: { projectId: existingTask.projectId, userId: session.user.id }
      });
      const isProjectAdmin = projectMember?.role === "OWNER" || projectMember?.role === "ADMIN";

      if (!isProjectAdmin && existingTask.assignedToId !== session.user.id) {
        return NextResponse.json({ error: "You can only move tasks assigned to you" }, { status: 403 });
      }
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data: { status },
      include: { project: true }
    });

    // Create Activity Log
    await prisma.activityLog.create({
      data: {
        action: "task_moved",
        entity: task.title,
        entityId: task.id,
        organizationId: task.project.organizationId,
        userId: session.user.id,
      },
    });

    // Trigger Pusher event for real-time Kanban update
    if (pusherServer) {
      await pusherServer.trigger(
        `org-${task.project.organizationId}`,
        "task-moved",
        {
          taskId: task.id,
          newStatus: task.status,
          movedBy: session.user.name || "A team member",
          userId: session.user.id
        }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TASK_MOVE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
