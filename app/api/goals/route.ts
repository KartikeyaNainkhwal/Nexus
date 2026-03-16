import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const goalSchema = z.object({
    title: z.string().min(1),
    targetAmount: z.number().positive(),
    currency: z.string().default("INR"),
    period: z.enum(["WEEKLY", "MONTHLY", "YEARLY"]).default("MONTHLY"),
    startDate: z.string(),
    endDate: z.string(),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.organizationId || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const goals = await prisma.goal.findMany({
            where: {
                organizationId: session.user.organizationId,
                userId: session.user.id,
            },
            orderBy: { endDate: "desc" },
        });

        // Auto-compute currentAmount from paid invoices within each goal's date range
        const goalsWithProgress = await Promise.all(
            goals.map(async (goal) => {
                const paidInvoices = await prisma.invoice.aggregate({
                    where: {
                        organizationId: session.user!.organizationId!,
                        status: "PAID",
                        paidAt: {
                            gte: goal.startDate,
                            lte: goal.endDate,
                        },
                    },
                    _sum: { total: true },
                });

                const currentAmount = paidInvoices._sum.total || 0;

                // Update in DB too
                if (currentAmount !== goal.currentAmount) {
                    await prisma.goal.update({
                        where: { id: goal.id },
                        data: { currentAmount },
                    });
                }

                return { ...goal, currentAmount };
            })
        );

        return NextResponse.json(goalsWithProgress);
    } catch (error) {
        console.error("[GOALS_GET]", error);
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
        const data = goalSchema.parse(json);

        const goal = await prisma.goal.create({
            data: {
                organizationId: session.user.organizationId,
                userId: session.user.id,
                title: data.title,
                targetAmount: data.targetAmount,
                currency: data.currency,
                period: data.period,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
            },
        });

        return NextResponse.json(goal, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("[GOALS_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
