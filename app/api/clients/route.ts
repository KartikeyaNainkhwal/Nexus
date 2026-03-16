import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createClientSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email is required"),
    company: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    currency: z.string().default("INR"),
    notes: z.string().optional(),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const clients = await prisma.client.findMany({
            where: { organizationId: session.user.organizationId },
            include: {
                _count: { select: { invoices: true } },
                invoices: {
                    select: { total: true, status: true, currency: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Compute summary for each client
        const clientsWithStats = clients.map((c) => {
            const totalInvoiced = c.invoices.reduce((sum, inv) => sum + inv.total, 0);
            const totalPaid = c.invoices
                .filter((inv) => inv.status === "PAID")
                .reduce((sum, inv) => sum + inv.total, 0);
            const totalPending = c.invoices
                .filter((inv) => inv.status === "SENT" || inv.status === "OVERDUE")
                .reduce((sum, inv) => sum + inv.total, 0);
            return {
                id: c.id,
                name: c.name,
                email: c.email,
                company: c.company,
                phone: c.phone,
                address: c.address,
                currency: c.currency,
                notes: c.notes,
                createdAt: c.createdAt,
                invoiceCount: c._count.invoices,
                totalInvoiced,
                totalPaid,
                totalPending,
            };
        });

        return NextResponse.json(clientsWithStats);
    } catch (error) {
        console.error("[CLIENTS_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const json = await req.json();
        const data = createClientSchema.parse(json);

        const client = await prisma.client.create({
            data: {
                ...data,
                organizationId: session.user.organizationId,
            },
        });

        return NextResponse.json(client, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("[CLIENTS_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
