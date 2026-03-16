import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");
        const isOrgAdmin = session.user.role === "OWNER" || session.user.role === "ADMIN";

        const documentWhere = isOrgAdmin
            ? {
                organizationId: session.user.organizationId,
                ...(projectId ? { projectId } : {})
            }
            : {
                organizationId: session.user.organizationId,
                ...(projectId ? { projectId } : {}),
                OR: [
                    // Shared with Workspace: Public AND not assigned to a project
                    { isPublic: true, projectId: null },
                    // Shared with Project: Public AND assigned to a project the user is in
                    { isPublic: true, projectId: { not: null }, project: { members: { some: { userId: session.user.id } } } },
                    // Creator: User created the document
                    { createdById: session.user.id },
                    // Collaborator: User is explicitly invited to edit
                    { collaborators: { some: { userId: session.user.id } } }
                ]
            };

        const documents = await prisma.document.findMany({
            where: documentWhere,
            include: {
                createdBy: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
                project: {
                    select: { id: true, name: true, emoji: true },
                },
            },
            orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json(documents);
    } catch (error) {
        console.error("[DOCUMENTS_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.organizationId || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const projectId = body.projectId || null;

        const document = await prisma.document.create({
            data: {
                organizationId: session.user.organizationId,
                projectId,
                title: "Untitled",
                emoji: "📄",
                createdById: session.user.id,
            },
            include: {
                createdBy: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
                project: {
                    select: { id: true, name: true, emoji: true },
                },
            },
        });

        await prisma.activityLog.create({
            data: {
                organizationId: session.user.organizationId,
                userId: session.user.id,
                action: "document_created",
                entity: "Document",
                entityId: document.id,
            },
        });

        return NextResponse.json(document, { status: 201 });
    } catch (error) {
        console.error("[DOCUMENTS_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
