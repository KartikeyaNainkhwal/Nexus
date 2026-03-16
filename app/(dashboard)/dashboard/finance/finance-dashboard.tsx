"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    TrendingUp, DollarSign, Receipt, Wallet,
    ArrowUpRight, ArrowDownRight, Clock, Users,
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie,
} from "recharts";
import { Card } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface FinanceStats {
    totalRevenue: number;
    pendingAmount: number;
    pendingCount: number;
    totalExpenses: number;
    netProfit: number;
    totalInvoices: number;
    totalClients: number;
    monthlyRevenue: { month: string; revenue: number; expenses: number }[];
    topClients: { name: string; revenue: number }[];
    statusBreakdown: { status: string; count: number; color: string }[];
    expenseByCategory: { category: string; amount: number }[];
    recentInvoices: {
        id: string;
        invoiceNumber: string;
        clientName: string;
        total: number;
        currency: string;
        status: string;
        dueDate: string;
        createdAt: string;
    }[];
}

const STATUS_COLORS: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
    SENT: "bg-blue-50 text-blue-600 border-blue-200",
    PAID: "bg-emerald-50 text-emerald-600 border-emerald-200",
    OVERDUE: "bg-red-50 text-red-600 border-red-200",
    CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
};

const CATEGORY_COLORS = [
    "#6366f1", "#f59e0b", "#10b981", "#ef4444",
    "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];

export function FinanceDashboard() {
    const [stats, setStats] = useState<FinanceStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/finance/stats")
            .then((r) => r.json())
            .then((data) => setStats(data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="space-y-8 max-w-7xl mx-auto animate-pulse">
                <div className="h-8 w-48 bg-bg-hover rounded-lg" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-[140px] bg-bg-surface border border-border rounded-2xl" />
                    ))}
                </div>
                <div className="h-[400px] bg-bg-surface border border-border rounded-2xl" />
            </div>
        );
    }

    if (!stats) return null;

    const profitMargin = stats.totalRevenue > 0
        ? ((stats.netProfit / stats.totalRevenue) * 100).toFixed(1)
        : "0";

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <PageHeader heading="Revenue Dashboard" description="Track income, expenses, and profit margins">
                <div className="flex gap-3">
                    <Link href="/dashboard/finance/invoices">
                        <Badge className="bg-accent/10 text-accent border-accent/20 hover:bg-accent/20 cursor-pointer transition-colors">
                            <Receipt className="h-3 w-3 mr-1" /> {stats.totalInvoices} Invoices
                        </Badge>
                    </Link>
                    <Link href="/dashboard/finance/clients">
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 cursor-pointer transition-colors">
                            <Users className="h-3 w-3 mr-1" /> {stats.totalClients} Clients
                        </Badge>
                    </Link>
                </div>
            </PageHeader>

            {/* ── METRIC CARDS ── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                <MetricBox
                    label="Total Revenue"
                    value={formatCurrency(stats.totalRevenue)}
                    icon={<DollarSign className="h-5 w-5" />}
                    iconBg="bg-emerald-50 text-emerald-600"
                    trend={<span className="text-emerald-500 flex items-center gap-0.5 text-xs font-bold"><ArrowUpRight className="h-3 w-3" /> Earned</span>}
                />
                <MetricBox
                    label="Pending Invoices"
                    value={formatCurrency(stats.pendingAmount)}
                    icon={<Clock className="h-5 w-5" />}
                    iconBg="bg-amber-50 text-amber-600"
                    trend={<span className="text-amber-500 text-xs font-bold">{stats.pendingCount} unpaid</span>}
                />
                <MetricBox
                    label="Total Expenses"
                    value={formatCurrency(stats.totalExpenses)}
                    icon={<Wallet className="h-5 w-5" />}
                    iconBg="bg-red-50 text-red-500"
                    trend={<span className="text-red-400 flex items-center gap-0.5 text-xs font-bold"><ArrowDownRight className="h-3 w-3" /> Spent</span>}
                />
                <MetricBox
                    label="Net Profit"
                    value={formatCurrency(stats.netProfit)}
                    icon={<TrendingUp className="h-5 w-5" />}
                    iconBg="bg-indigo-50 text-indigo-600"
                    trend={<span className={cn("text-xs font-bold", stats.netProfit >= 0 ? "text-emerald-500" : "text-red-500")}>{profitMargin}% margin</span>}
                />
            </motion.div>

            {/* ── CHARTS ROW ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue vs Expenses Chart */}
                <Card className="lg:col-span-2 p-6 h-[420px] flex flex-col shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-display font-bold text-text-primary">Revenue vs Expenses</h3>
                        <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Last 12 months</span>
                    </div>
                    <div className="flex-1 w-full text-xs font-bold">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.monthlyRevenue}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 700 }} />
                                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 700 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "var(--bg-surface)",
                                        borderColor: "var(--border)",
                                        borderRadius: "12px",
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                    }}
                                    formatter={(value: number) => [formatCurrency(value), undefined]}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2.5} name="Revenue" />
                                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} strokeDasharray="5 5" name="Expenses" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
                            <div className="h-2 w-6 rounded-full bg-emerald-500" /> Revenue
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
                            <div className="h-2 w-6 rounded-full bg-red-400 opacity-60" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 3px, var(--bg-surface) 3px, var(--bg-surface) 5px)" }} /> Expenses
                        </div>
                    </div>
                </Card>

                {/* Top Clients */}
                <Card className="p-6 h-[420px] flex flex-col shadow-sm">
                    <h3 className="font-display font-bold text-text-primary mb-6">Top Clients</h3>
                    {stats.topClients.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-text-muted text-sm italic">No paid invoices yet</div>
                    ) : (
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.topClients} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                    <CartesianGrid stroke="var(--border)" horizontal vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: "var(--text-secondary)", fontSize: 11, fontWeight: 700 }} width={100} />
                                    <Tooltip
                                        cursor={{ fill: "rgba(0,0,0,0.02)" }}
                                        contentStyle={{
                                            backgroundColor: "var(--bg-surface)",
                                            borderColor: "var(--border)",
                                            borderRadius: "12px",
                                            fontSize: "12px",
                                            fontWeight: 700,
                                        }}
                                        formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                                    />
                                    <Bar dataKey="revenue" radius={[0, 8, 8, 0]} barSize={24}>
                                        {stats.topClients.map((_, index) => (
                                            <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>
            </div>

            {/* ── BOTTOM ROW ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Invoice Status */}
                <Card className="p-6 flex flex-col shadow-sm">
                    <h3 className="font-display font-bold text-text-primary mb-6">Invoice Status</h3>
                    {stats.statusBreakdown.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-text-muted text-sm italic">No invoices yet</div>
                    ) : (
                        <>
                            <div className="flex-1 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={stats.statusBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={75}
                                            paddingAngle={6}
                                            dataKey="count"
                                            nameKey="status"
                                            stroke="none"
                                        >
                                            {stats.statusBreakdown.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {stats.statusBreakdown.map((s) => (
                                    <div key={s.status} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-bg-hover/50 border border-border">
                                        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                                        <span className="text-[10px] text-text-secondary uppercase tracking-tight font-black truncate">
                                            {s.status}: {s.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </Card>

                {/* Recent Invoices */}
                <Card className="lg:col-span-2 p-6 flex flex-col shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-display font-bold text-text-primary">Recent Invoices</h3>
                        <Link href="/dashboard/finance/invoices">
                            <span className="text-[10px] font-black uppercase text-accent hover:text-accent-text tracking-widest cursor-pointer">View All</span>
                        </Link>
                    </div>
                    {stats.recentInvoices.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-text-muted text-sm italic py-12">
                            No invoices created yet. Create your first invoice to see it here.
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-2">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="px-3 py-3 font-bold text-text-muted uppercase tracking-wider text-[10px]">Invoice</th>
                                        <th className="px-3 py-3 font-bold text-text-muted uppercase tracking-wider text-[10px]">Client</th>
                                        <th className="px-3 py-3 font-bold text-text-muted uppercase tracking-wider text-[10px]">Amount</th>
                                        <th className="px-3 py-3 font-bold text-text-muted uppercase tracking-wider text-[10px]">Status</th>
                                        <th className="px-3 py-3 font-bold text-text-muted uppercase tracking-wider text-[10px]">Due</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {stats.recentInvoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-bg-hover transition-colors group">
                                            <td className="px-3 py-3.5 font-black text-accent text-xs">{inv.invoiceNumber}</td>
                                            <td className="px-3 py-3.5 font-bold text-text-primary text-xs">{inv.clientName}</td>
                                            <td className="px-3 py-3.5 font-black text-text-primary text-xs">{formatCurrency(inv.total, inv.currency)}</td>
                                            <td className="px-3 py-3.5">
                                                <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border", STATUS_COLORS[inv.status] || "")}>{inv.status}</span>
                                            </td>
                                            <td className="px-3 py-3.5 text-[10px] font-bold text-text-muted uppercase tracking-tight">
                                                {format(new Date(inv.dueDate), "MMM d, yyyy")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

function MetricBox({
    label, value, icon, iconBg, trend,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    iconBg: string;
    trend?: React.ReactNode;
}) {
    return (
        <Card className="p-6 flex flex-col shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center", iconBg)}>
                    {icon}
                </div>
                {trend}
            </div>
            <p className="text-2xl font-black text-text-primary tracking-tight">{value}</p>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-1">{label}</p>
        </Card>
    );
}
