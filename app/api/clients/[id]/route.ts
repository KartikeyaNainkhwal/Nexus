import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateClientSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    company: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    currency: z.string().optional(),
    notes: z.string().nullable().optional(),
});

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const client = await prisma.client.findFirst({
            where: { id, organizationId: session.user.organizationId },
            include: {
                invoices: {
                    orderBy: { createdAt: "desc" },
                    include: { items: true },
                },
                expenses: { orderBy: { date: "desc" } },
            },
        });

        if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        return NextResponse.json(client);
    } catch (error) {
        console.error("[CLIENT_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const json = await req.json();
        const data = updateClientSchema.parse(json);

        const client = await prisma.client.updateMany({
            where: { id, organizationId: session.user.organizationId },
            data,
        });

        if (client.count === 0) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        const updated = await prisma.client.findUnique({ where: { id } });
        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("[CLIENT_PUT]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await prisma.client.deleteMany({
            where: { id, organizationId: session.user.organizationId },
        });

        if (result.count === 0) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[CLIENT_DELETE]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
