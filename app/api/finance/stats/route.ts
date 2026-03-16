import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const orgId = session.user.organizationId;

        // Fetch all invoices and expenses for the org
        const [invoices, expenses, clients] = await Promise.all([
            prisma.invoice.findMany({
                where: { organizationId: orgId },
                include: { client: { select: { id: true, name: true } } },
                orderBy: { createdAt: "desc" },
            }),
            prisma.expense.findMany({
                where: { organizationId: orgId },
                orderBy: { date: "desc" },
            }),
            prisma.client.findMany({
                where: { organizationId: orgId },
                select: { id: true, name: true },
            }),
        ]);

        // ── Totals ──
        const totalRevenue = invoices
            .filter((inv) => inv.status === "PAID")
            .reduce((sum, inv) => sum + inv.total, 0);

        const pendingAmount = invoices
            .filter((inv) => inv.status === "SENT" || inv.status === "OVERDUE")
            .reduce((sum, inv) => sum + inv.total, 0);

        const pendingCount = invoices.filter(
            (inv) => inv.status === "SENT" || inv.status === "OVERDUE"
        ).length;

        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const netProfit = totalRevenue - totalExpenses;

        // ── Monthly revenue (last 12 months) ──
        const now = new Date();
        const monthlyRevenue: { month: string; revenue: number; expenses: number }[] = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
            const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

            const monthRevenue = invoices
                .filter(
                    (inv) =>
                        inv.status === "PAID" &&
                        inv.paidAt &&
                        new Date(inv.paidAt) >= monthStart &&
                        new Date(inv.paidAt) <= monthEnd
                )
                .reduce((sum, inv) => sum + inv.total, 0);

            const monthExpenses = expenses
                .filter(
                    (exp) =>
                        new Date(exp.date) >= monthStart && new Date(exp.date) <= monthEnd
                )
                .reduce((sum, exp) => sum + exp.amount, 0);

            monthlyRevenue.push({ month: label, revenue: monthRevenue, expenses: monthExpenses });
        }

        // ── Top clients by revenue ──
        const clientRevenue: Record<string, { name: string; revenue: number }> = {};
        invoices
            .filter((inv) => inv.status === "PAID")
            .forEach((inv) => {
                const key = inv.clientId;
                if (!clientRevenue[key]) {
                    clientRevenue[key] = { name: inv.client.name, revenue: 0 };
                }
                clientRevenue[key].revenue += inv.total;
            });

        const topClients = Object.values(clientRevenue)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // ── Invoice status breakdown ──
        const statusBreakdown = [
            { status: "DRAFT", count: invoices.filter((i) => i.status === "DRAFT").length, color: "#94a3b8" },
            { status: "SENT", count: invoices.filter((i) => i.status === "SENT").length, color: "#3b82f6" },
            { status: "PAID", count: invoices.filter((i) => i.status === "PAID").length, color: "#10b981" },
            { status: "OVERDUE", count: invoices.filter((i) => i.status === "OVERDUE").length, color: "#ef4444" },
            { status: "CANCELLED", count: invoices.filter((i) => i.status === "CANCELLED").length, color: "#6b7280" },
        ].filter((s) => s.count > 0);

        // ── Expense category breakdown ──
        const categoryMap: Record<string, number> = {};
        expenses.forEach((exp) => {
            categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
        });
        const expenseByCategory = Object.entries(categoryMap)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);

        // ── Recent invoices ──
        const recentInvoices = invoices.slice(0, 5).map((inv) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            clientName: inv.client.name,
            total: inv.total,
            currency: inv.currency,
            status: inv.status,
            dueDate: inv.dueDate,
            createdAt: inv.createdAt,
        }));

        return NextResponse.json({
            totalRevenue,
            pendingAmount,
            pendingCount,
            totalExpenses,
            netProfit,
            totalInvoices: invoices.length,
            totalClients: clients.length,
            monthlyRevenue,
            topClients,
            statusBreakdown,
            expenseByCategory,
            recentInvoices,
        });
    } catch (error) {
        console.error("[FINANCE_STATS]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
