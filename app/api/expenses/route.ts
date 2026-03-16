import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createExpenseSchema = z.object({
    description: z.string().min(1, "Description is required"),
    amount: z.number().positive("Amount must be positive"),
    currency: z.string().default("INR"),
    category: z.enum([
        "SOFTWARE", "HOSTING", "DESIGN", "MARKETING",
        "TRAVEL", "EQUIPMENT", "OFFICE", "OTHER"
    ]).default("OTHER"),
    date: z.string().optional(),
    clientId: z.string().nullable().optional(),
    projectId: z.string().nullable().optional(),
    receiptUrl: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
});

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const category = searchParams.get("category");
        const clientId = searchParams.get("clientId");

        const where: Record<string, unknown> = {
            organizationId: session.user.organizationId,
        };
        if (category) where.category = category;
        if (clientId) where.clientId = clientId;

        const expenses = await prisma.expense.findMany({
            where,
            include: {
                client: { select: { id: true, name: true } },
                project: { select: { id: true, name: true, emoji: true } },
            },
            orderBy: { date: "desc" },
        });

        return NextResponse.json(expenses);
    } catch (error) {
        console.error("[EXPENSES_GET]", error);
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
        const data = createExpenseSchema.parse(json);

        const expense = await prisma.expense.create({
            data: {
                organizationId: session.user.organizationId,
                description: data.description,
                amount: data.amount,
                currency: data.currency,
                category: data.category,
                date: data.date ? new Date(data.date) : new Date(),
                clientId: data.clientId ?? undefined,
                projectId: data.projectId ?? undefined,
                receiptUrl: data.receiptUrl,
                notes: data.notes,
            },
            include: {
                client: { select: { id: true, name: true } },
                project: { select: { id: true, name: true, emoji: true } },
            },
        });

        return NextResponse.json(expense, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("[EXPENSES_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
