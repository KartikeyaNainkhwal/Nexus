import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await auth();
        if (!session?.user?.organizationId || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const task = await prisma.task.findUnique({
            where: { id: params.id },
            include: {
                project: {
                    include: {
                        members: {
                            where: { role: { in: ["OWNER", "ADMIN"] } }
                        }
                    }
                }
            }
        });

        if (!task || task.organizationId !== session.user.organizationId) {
            return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
        }

        // Find the admins to notify
        const adminsToNotify = task.project.members.map(m => m.userId);

        if (adminsToNotify.length === 0) {
            // Fallback to org owners/admins if no project admins exist
            const orgAdmins = await prisma.organizationMember.findMany({
                where: {
                    organizationId: session.user.organizationId,
                    role: { in: ["OWNER", "ADMIN"] }
                }
            });
            adminsToNotify.push(...orgAdmins.map(a => a.userId));
        }

        // De-duplicate
        const uniqueAdmins = Array.from(new Set(adminsToNotify));

        await Promise.all(
            uniqueAdmins.map(adminId =>
                createNotification({
                    userId: adminId,
                    organizationId: session.user.organizationId!,
                    type: "TASK_ASSIGNMENT_REQUEST",
                    message: `${session.user.name} requested to be assigned to "${task.title}"`,
                    link: `/dashboard/projects/${task.projectId}?taskId=${task.id}`
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[TASK_REQUEST_ASSIGNMENT]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
