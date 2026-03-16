import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.organizationId || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const running = await prisma.timeEntry.findFirst({
            where: {
                userId: session.user.id,
                organizationId: session.user.organizationId,
                endTime: null,
            },
            include: {
                task: { select: { id: true, title: true } },
                project: { select: { id: true, name: true, emoji: true, color: true } },
            },
        });

        return NextResponse.json(running);
    } catch (error) {
        console.error("[TIME_ENTRIES_RUNNING]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
