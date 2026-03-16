import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createNotification } from "@/lib/notifications";
import { TaskStatus, TaskPriority } from "@prisma/client";

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assignedToId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, avatar: true } },
      }
    });

    if (!task || task.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASK_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await prisma.task.findUnique({ where: { id: params.id } });
    if (!task || task.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    // Permission check: regular members can only update tasks assigned to them
    const isOrgAdmin = session.user.role === "OWNER" || session.user.role === "ADMIN";
    if (!isOrgAdmin) {
      // Check if user is a project admin/owner
      const projectMember = await prisma.projectMember.findFirst({
        where: { projectId: task.projectId, userId: session.user.id }
      });
      const isProjectAdmin = projectMember?.role === "OWNER" || projectMember?.role === "ADMIN";

      if (!isProjectAdmin && task.assignedToId !== session.user.id) {
        return NextResponse.json({ error: "You can only update tasks assigned to you" }, { status: 403 });
      }
    }

    const json = await req.json();
    const body = updateTaskSchema.parse(json);

    const updated = await prisma.task.update({
      where: { id: params.id },
      data: body,
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true } },
      }
    });

    if (body.status === "DONE" && task.status !== "DONE") {
      const projectMembers = await prisma.projectMember.findMany({
        where: { projectId: task.projectId, userId: { not: session.user.id } }
      });

      await Promise.all(projectMembers.map(member =>
        createNotification({
          userId: member.userId,
          organizationId: session.user.organizationId!,
          type: "TASK_COMPLETED",
          message: `${session.user.name} completed "${task.title}"`,
          link: `/dashboard/projects/${task.projectId}?taskId=${task.id}`
        })
      ));

      await prisma.activityLog.create({
        data: {
          organizationId: session.user.organizationId,
          userId: session.user.id,
          action: "task_completed",
          entity: "Task",
          entityId: task.id,
        }
      });
    } else if (body.assignedToId && task.assignedToId !== body.assignedToId && body.assignedToId !== session.user.id) {
      await createNotification({
        userId: body.assignedToId,
        organizationId: session.user.organizationId,
        type: "TASK_ASSIGNED",
        message: `${session.user.name} assigned you to "${task.title}"`,
        link: `/dashboard/projects/${task.projectId}?taskId=${task.id}`
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[TASK_PATCH]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as z.ZodError).issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await prisma.task.findUnique({ where: { id: params.id } });
    if (!task || task.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.task.delete({ where: { id: params.id } }),
      prisma.activityLog.create({
        data: {
          organizationId: session.user.organizationId,
          userId: session.user.id,
          action: "task_deleted",
          entity: "Task",
          entityId: task.id,
          metadata: { taskTitle: task.title }
        }
      })
    ]);

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("[TASK_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
