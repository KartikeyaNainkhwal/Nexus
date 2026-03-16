import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await params;

        // Verify project belongs to organization
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { organizationId: true },
        });

        if (!project || project.organizationId !== session.user.organizationId) {
            return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
        }

        // Get all org members
        const orgMembers = await prisma.organizationMember.findMany({
            where: { organizationId: session.user.organizationId },
            include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
            },
        });

        // Get current project members
        const projectMembers = await prisma.projectMember.findMany({
            where: { projectId },
            select: { userId: true },
        });

        const projectMemberIds = new Set(projectMembers.map((pm) => pm.userId));

        // Filter out users already in the project
        const availableMembers = orgMembers.filter(
            (om) => !projectMemberIds.has(om.userId)
        );

        return NextResponse.json(availableMembers);
    } catch (error) {
        console.error("[PROJECT_MEMBERS_AVAILABLE_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
