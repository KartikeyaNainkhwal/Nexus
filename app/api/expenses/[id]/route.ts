import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateExpenseSchema = z.object({
    description: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    currency: z.string().optional(),
    category: z.enum([
        "SOFTWARE", "HOSTING", "DESIGN", "MARKETING",
        "TRAVEL", "EQUIPMENT", "OFFICE", "OTHER"
    ]).optional(),
    date: z.string().optional(),
    clientId: z.string().nullable().optional(),
    projectId: z.string().nullable().optional(),
    receiptUrl: z.string().nullable().optional(),
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

        const expense = await prisma.expense.findFirst({
            where: { id, organizationId: session.user.organizationId },
            include: {
                client: { select: { id: true, name: true } },
                project: { select: { id: true, name: true, emoji: true } },
            },
        });

        if (!expense) {
            return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        }

        return NextResponse.json(expense);
    } catch (error) {
        console.error("[EXPENSE_GET]", error);
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
        const data = updateExpenseSchema.parse(json);

        const updateData: Record<string, unknown> = { ...data };
        if (data.date) updateData.date = new Date(data.date);

        const result = await prisma.expense.updateMany({
            where: { id, organizationId: session.user.organizationId },
            data: updateData,
        });

        if (result.count === 0) {
            return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        }

        const updated = await prisma.expense.findUnique({
            where: { id },
            include: {
                client: { select: { id: true, name: true } },
                project: { select: { id: true, name: true, emoji: true } },
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("[EXPENSE_PUT]", error);
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

        const result = await prisma.expense.deleteMany({
            where: { id, organizationId: session.user.organizationId },
        });

        if (result.count === 0) {
            return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[EXPENSE_DELETE]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
