import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { type KanbanProject } from "./kanban-board";
import { TaskPriority, TaskStatus } from "@prisma/client";
import { Metadata } from "next";
import { ProjectTabs } from "./project-tabs";

export const metadata: Metadata = {
  title: "Project Board | TeamFlow",
  description: "View and manage tasks on the project Kanban board.",
};

interface TaskWithAssignee {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  assignedToId: string | null;
  assignedTo: { id: string; name: string | null; avatar: string | null } | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface MemberWithUser {
  role: string;
  user: { id: string; name: string | null; avatar: string | null };
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();

  if (!session?.user?.id || !session.user.organizationId) {
    redirect("/login");
  }

  const project = await prisma.project.findUnique({
    where: {
      id: params.id,
      organizationId: session.user.organizationId
    },
    include: {
      tasks: {
        where: { parentTaskId: null },
        include: {
          assignedTo: {
            select: { id: true, name: true, avatar: true }
          }
        },
        orderBy: { position: "asc" }
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, avatar: true }
          }
        }
      }
    }
  });

  if (!project) {
    notFound();
  }

  const serializedProject: KanbanProject = {
    id: project.id,
    name: project.name,
    description: project.description,
    emoji: project.emoji,
    color: project.color,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    tasks: (project.tasks as unknown as TaskWithAssignee[]).map(t => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      dueDate: t.dueDate?.toISOString() ?? null,
    })),
    members: (project.members as unknown as MemberWithUser[]).map(m => ({
      id: m.user.id,
      name: m.user.name || "User",
      avatar: m.user.avatar,
      role: m.role
    }))
  };

  return <ProjectTabs project={serializedProject} />;
}
