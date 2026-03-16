import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DocsClient } from "./docs-client";

export const dynamic = "force-dynamic";

export default async function DocsPage() {
    const session = await auth();
    if (!session?.user?.organizationId) redirect("/login");

    const isOrgAdmin = session.user.role === "OWNER" || session.user.role === "ADMIN";

    const documentWhere = isOrgAdmin
        ? { organizationId: session.user.organizationId }
        : {
            organizationId: session.user.organizationId,
            OR: [
                { projectId: { not: null }, project: { members: { some: { userId: session.user.id } } } },
                { projectId: null, createdById: session.user.id },
                { isPublic: true },
                { collaborators: { some: { userId: session.user.id } } }
            ]
        };

    const documents = await prisma.document.findMany({
        where: documentWhere,
        include: {
            createdBy: { select: { id: true, name: true, email: true, avatar: true } },
            project: { select: { id: true, name: true, emoji: true } },
        },
        orderBy: { updatedAt: "desc" },
    });

    const serializedDocs = documents.map(doc => ({
        ...doc,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    }));

    return <DocsClient initialDocuments={serializedDocs as never} />;
}
