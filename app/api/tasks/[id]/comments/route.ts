import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const commentSchema = z.object({
    content: z.string().min(1),
});

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const comments = await prisma.comment.findMany({
            where: {
                taskId: params.id,
                task: {
                    organizationId: session.user.organizationId,
                },
            },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
            },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json(comments);
    } catch (error) {
        console.error("[COMMENTS_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.organizationId || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const json = await req.json();
        const body = commentSchema.parse(json);

        // Verify task exists and belongs to user's org
        const task = await prisma.task.findUnique({
            where: { id: params.id },
            include: { project: true },
        });

        if (!task || task.organizationId !== session.user.organizationId) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        const comment = await prisma.comment.create({
            data: {
                content: body.content,
                taskId: task.id,
                userId: session.user.id,
            },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
            },
        });

        // Activity log
        await prisma.activityLog.create({
            data: {
                organizationId: session.user.organizationId,
                userId: session.user.id,
                action: "added_comment",
                entity: "Task",
                entityId: task.id,
                metadata: { commentId: comment.id },
            },
        });

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error("[COMMENTS_POST]", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
