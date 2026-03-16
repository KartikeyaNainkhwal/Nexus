import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkProjectLimit } from "@/lib/planLimits";
import { createNotification } from "@/lib/notifications";

const createProjectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  color: z.string().default("#6366f1"),
  emoji: z.string().default("📁"),
});

export async function GET(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isOrgAdmin = session.user.role === "OWNER" || session.user.role === "ADMIN";

    const projectWhere = isOrgAdmin
      ? { organizationId: session.user.organizationId }
      : {
        organizationId: session.user.organizationId,
        members: { some: { userId: session.user.id } }
      };

    const projects = await prisma.project.findMany({
      where: projectWhere,
      include: {
        _count: {
          select: { tasks: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const enrichedProjects = await Promise.all(projects.map(async (project) => {
      const doneCount = await prisma.task.count({
        where: { projectId: project.id, status: "DONE" }
      });
      const progress = project._count.tasks > 0 ? Math.round((doneCount / project._count.tasks) * 100) : 0;

      return {
        ...project,
        doneTasksCount: doneCount,
        progress
      };
    }));

    return NextResponse.json(enrichedProjects);
  } catch (error) {
    console.error("[PROJECTS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const body = createProjectSchema.parse(json);

    await checkProjectLimit(session.user.organizationId);

    const project = await prisma.project.create({
      data: {
        ...body,
        organizationId: session.user.organizationId,
        createdById: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER"
          }
        }
      }
    });

    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: "project_created",
        entity: "Project",
        entityId: project.id,
      }
    });

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: session.user.organizationId, userId: { not: session.user.id } }
    });

    await Promise.all(members.map(member =>
      createNotification({
        userId: member.userId,
        organizationId: session.user.organizationId!,
        type: "PROJECT_CREATED",
        message: `${session.user.name} created project ${project.name}`,
        link: `/dashboard/projects/${project.id}`
      })
    ));

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("[PROJECTS_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as z.ZodError).issues }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Error" }, { status: error instanceof Error && error.message.includes("limit") ? 403 : 500 });
  }
}
