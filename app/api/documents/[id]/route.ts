import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const isOrgAdmin = session.user.role === "OWNER" || session.user.role === "ADMIN";

        const document = await prisma.document.findFirst({
            where: {
                id: params.id,
                organizationId: session.user.organizationId,
                ...(!isOrgAdmin && {
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
                })
            },
            include: {
                createdBy: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
                lastEditedBy: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
                project: {
                    select: { id: true, name: true, emoji: true },
                },
                collaborators: {
                    include: {
                        user: { select: { id: true, name: true, email: true, avatar: true } },
                    },
                },
            },
        });

        if (!document) {
            return NextResponse.json({ error: "Not Found" }, { status: 404 });
        }

        return NextResponse.json(document);
    } catch (error) {
        console.error("[DOCUMENT_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.organizationId || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, content, emoji, isPinned, isPublic } = body;

        const isOrgAdmin = session.user.role === "OWNER" || session.user.role === "ADMIN";

        // To PATCH, user must be Org Admin, creator, or a collaborator (or we could restrict further if needed)
        // Let's enforce that if they are an org admin, they can edit. Otherwise, they must be the creator, 
        // a project owner/admin (for project docs), or explicitly allowed. For now, let's keep it consistent:
        const documentCheck = await prisma.document.findFirst({
            where: {
                id: params.id,
                organizationId: session.user.organizationId,
                ...(!isOrgAdmin && {
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
                })
            }
        });

        if (!documentCheck) {
            return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
        }

        const document = await prisma.document.update({
            where: {
                id: params.id,
                // Already checked existence and auth
            },
            data: {
                ...(title !== undefined && { title }),
                ...(content !== undefined && { content }),
                ...(emoji !== undefined && { emoji }),
                ...(isPinned !== undefined && { isPinned }),
                ...(isPublic !== undefined && { isPublic }),
                lastEditedById: session.user.id,
            },
            include: {
                createdBy: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
                lastEditedBy: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
                project: {
                    select: { id: true, name: true, emoji: true },
                },
            },
        });

        return NextResponse.json(document);
    } catch (error) {
        console.error("[DOCUMENT_PATCH]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.organizationId || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const isOrgAdmin = session.user.role === "OWNER" || session.user.role === "ADMIN";

        const document = await prisma.document.findFirst({
            where: {
                id: params.id,
                organizationId: session.user.organizationId,
                ...(!isOrgAdmin && {
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
                })
            },
        });

        if (!document) {
            return NextResponse.json({ error: "Not Found" }, { status: 404 });
        }

        // Check ownership or admin/owner role
        const member = await prisma.organizationMember.findFirst({
            where: {
                userId: session.user.id,
                organizationId: session.user.organizationId,
            },
        });

        const isOwnerOrAdmin = member?.role === "OWNER" || member?.role === "ADMIN";
        const isCreator = document.createdById === session.user.id;

        if (!isCreator && !isOwnerOrAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.document.delete({ where: { id: params.id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[DOCUMENT_DELETE]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
