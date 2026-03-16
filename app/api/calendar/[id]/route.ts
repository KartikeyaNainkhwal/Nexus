import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const eventSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional().nullable(),
    allDay: z.boolean().optional(),
    color: z.string().optional(),
    projectId: z.string().optional().nullable(),
});

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
        const result = eventSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.format() }, { status: 400 });
        }

        const { title, description, startDate, endDate, allDay, color, projectId } = result.data;

        // Check ownership or admin
        const existing = await prisma.calendarEvent.findFirst({
            where: {
                id: params.id,
                organizationId: session.user.organizationId,
            },
        });

        if (!existing) {
            return NextResponse.json({ error: "Not Found" }, { status: 404 });
        }

        const event = await prisma.calendarEvent.update({
            where: { id: params.id },
            data: {
                ...(title && { title }),
                description,
                ...(startDate && { startDate: new Date(startDate) }),
                endDate: endDate ? new Date(endDate) : null,
                ...(allDay !== undefined && { allDay }),
                ...(color && { color }),
                projectId,
            },
        });

        return NextResponse.json(event);
    } catch (error) {
        console.error("[CALENDAR_PATCH]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const existing = await prisma.calendarEvent.findFirst({
            where: {
                id: params.id,
                organizationId: session.user.organizationId,
            },
        });

        if (!existing) {
            return NextResponse.json({ error: "Not Found" }, { status: 404 });
        }

        await prisma.calendarEvent.delete({ where: { id: params.id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[CALENDAR_DELETE]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
