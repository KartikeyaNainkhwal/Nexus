import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  emoji: z.string().optional(),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        tasks: {
          include: { assignedTo: { select: { id: true, name: true, avatar: true } } },
          orderBy: { position: "asc" }
        },
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
        }
      }
    });

    if (!project || project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("[PROJECT_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const body = updateProjectSchema.parse(json);

    const project = await prisma.project.findUnique({ where: { id: params.id } });
    if (!project || project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    // RBAC: Only Org Admin/Owner or Project Admin/Owner can edit
    const isOrgAdmin = session.user.role === "OWNER" || session.user.role === "ADMIN";
    if (!isOrgAdmin) {
      const pm = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: project.id, userId: session.user.id } }
      });
      if (!pm || (pm.role !== "OWNER" && pm.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden: Requires Admin role" }, { status: 403 });
      }
    }

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: body
    });

    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: "project_updated",
        entity: "Project",
        entityId: project.id,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PROJECT_PATCH]", error);
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

    const project = await prisma.project.findUnique({ where: { id: params.id } });
    if (!project || project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    // RBAC: Only Org Admin/Owner or Project Owner can delete
    const isOrgAdmin = session.user.role === "OWNER" || session.user.role === "ADMIN";
    if (!isOrgAdmin) {
      const pm = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: project.id, userId: session.user.id } }
      });
      if (!pm || pm.role !== "OWNER") {
        return NextResponse.json({ error: "Forbidden: Requires Owner role" }, { status: 403 });
      }
    }

    await prisma.$transaction([
      prisma.task.deleteMany({ where: { projectId: params.id } }),
      prisma.projectMember.deleteMany({ where: { projectId: params.id } }),
      prisma.project.delete({ where: { id: params.id } }),
      prisma.activityLog.create({
        data: {
          organizationId: session.user.organizationId,
          userId: session.user.id,
          action: "project_deleted",
          entity: "Project",
          entityId: project.id,
          metadata: { projectName: project.name }
        }
      })
    ]);

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("[PROJECT_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
