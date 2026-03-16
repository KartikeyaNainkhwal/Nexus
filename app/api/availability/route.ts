import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const slotSchema = z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    isAvailable: z.boolean().default(true),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.organizationId || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const slots = await prisma.availabilitySlot.findMany({
            where: {
                organizationId: session.user.organizationId,
                userId: session.user.id,
            },
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        });

        return NextResponse.json(slots);
    } catch (error) {
        console.error("[AVAILABILITY_GET]", error);
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
        const data = slotSchema.parse(json);

        const slot = await prisma.availabilitySlot.create({
            data: {
                organizationId: session.user.organizationId,
                userId: session.user.id,
                ...data,
            },
        });

        return NextResponse.json(slot, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("[AVAILABILITY_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
