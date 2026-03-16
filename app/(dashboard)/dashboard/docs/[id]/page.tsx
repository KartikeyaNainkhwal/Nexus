import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { DocEditorClient } from "./doc-editor-client";

export const dynamic = "force-dynamic";

export default async function DocPage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.organizationId) redirect("/login");

    const document = await prisma.document.findFirst({
        where: {
            id: params.id,
            organizationId: session.user.organizationId,
        },
        include: {
            createdBy: { select: { id: true, name: true, email: true, avatar: true } },
            lastEditedBy: { select: { id: true, name: true, email: true, avatar: true } },
            project: { select: { id: true, name: true, emoji: true } },
        },
    });

    if (!document) notFound();

    const allDocs = await prisma.document.findMany({
        where: { organizationId: session.user.organizationId },
        include: {
            createdBy: { select: { id: true, name: true, email: true, avatar: true } },
            project: { select: { id: true, name: true, emoji: true } },
        },
        orderBy: { updatedAt: "desc" },
    });

    const serializedDocument = {
        ...document,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
    };

    const serializedAllDocs = allDocs.map(doc => ({
        ...doc,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    }));

    const userInitials = (session.user.name ?? "U")
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return <DocEditorClient document={serializedDocument as never} allDocuments={serializedAllDocs as never} userInitials={userInitials} />;
}
