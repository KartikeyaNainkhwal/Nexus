"use client";

import { useEffect, useState } from "react";
import { Plus, Wallet, Search, Trash2, Edit3, Tag } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency, CURRENCY_LIST } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface Expense {
    id: string;
    category: string;
    description: string;
    amount: number;
    currency: string;
    date: string;
    receiptUrl: string | null;
    notes: string | null;
    client: { id: string; name: string } | null;
    project: { id: string; name: string; emoji: string } | null;
}

const CATEGORIES = ["SOFTWARE", "HOSTING", "DESIGN", "MARKETING", "TRAVEL", "EQUIPMENT", "OFFICE", "OTHER"];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    SOFTWARE: { bg: "bg-indigo-50", text: "text-indigo-600", dot: "#6366f1" },
    HOSTING: { bg: "bg-blue-50", text: "text-blue-600", dot: "#3b82f6" },
    DESIGN: { bg: "bg-pink-50", text: "text-pink-600", dot: "#ec4899" },
    MARKETING: { bg: "bg-amber-50", text: "text-amber-600", dot: "#f59e0b" },
    TRAVEL: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "#10b981" },
    EQUIPMENT: { bg: "bg-purple-50", text: "text-purple-600", dot: "#8b5cf6" },
    OFFICE: { bg: "bg-cyan-50", text: "text-cyan-600", dot: "#06b6d4" },
    OTHER: { bg: "bg-gray-50", text: "text-gray-600", dot: "#6b7280" },
};

const PIE_COLORS = ["#6366f1", "#3b82f6", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6", "#06b6d4", "#6b7280"];

export function ExpensesClient() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [showModal, setShowModal] = useState(false);

    const fetchExpenses = () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (categoryFilter) params.set("category", categoryFilter);
        fetch(`/api/expenses?${params}`)
            .then((r) => r.json())
            .then((data) => setExpenses(Array.isArray(data) ? data : []))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchExpenses(); }, [categoryFilter]);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this expense?")) return;
        try {
            const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
            if (res.ok) { toast.success("Expense deleted"); fetchExpenses(); }
        } catch { toast.error("Failed"); }
    };

    const filtered = expenses.filter((e) => {
        if (!search) return true;
        return e.description.toLowerCase().includes(search.toLowerCase());
    });

    const totalExpenses = filtered.reduce((sum, e) => sum + e.amount, 0);

    // Category breakdown for pie chart
    const categoryData = Object.entries(
        filtered.reduce<Record<string, number>>((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount;
            return acc;
        }, {})
    ).map(([name, value]) => ({ name, value }));

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <PageHeader heading="Expenses" description="Track and categorize your business expenses">
                <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowModal(true)}>
                    Add Expense
                </Button>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: List */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Summary + Search */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-surface border border-border shadow-sm">
                            <Wallet className="h-4 w-4 text-red-400" />
                            <span className="text-xs font-black text-text-primary">{formatCurrency(totalExpenses)}</span>
                            <span className="text-[10px] text-text-muted">total</span>
                        </div>
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Search expenses..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-bg-surface border border-border rounded-xl text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
                            />
                        </div>
                    </div>

                    {/* Category Filters */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setCategoryFilter("")}
                            className={cn("text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all", !categoryFilter ? "bg-accent text-white border-accent" : "bg-bg-surface text-text-muted border-border")}
                        >All</button>
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={cn(
                                    "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all",
                                    categoryFilter === cat ? "bg-accent text-white border-accent" : cn(CATEGORY_COLORS[cat].bg, CATEGORY_COLORS[cat].text, "border-transparent")
                                )}
                            >{cat}</button>
                        ))}
                    </div>

                    {/* Expenses List */}
                    <div className="space-y-3">
                        {loading ? (
                            [1, 2, 3].map((i) => <div key={i} className="h-[72px] bg-bg-surface border border-border rounded-2xl animate-pulse" />)
                        ) : filtered.length === 0 ? (
                            <Card className="p-12 text-center">
                                <Wallet className="h-10 w-10 text-text-subtle mx-auto mb-3" />
                                <p className="text-sm font-bold text-text-muted">No expenses found</p>
                            </Card>
                        ) : (
                            filtered.map((expense) => (
                                <Card key={expense.id} className="p-4 flex items-center gap-4 group hover:border-accent/30 shadow-sm">
                                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", CATEGORY_COLORS[expense.category]?.bg || "bg-gray-50")}>
                                        <Tag className={cn("h-4 w-4", CATEGORY_COLORS[expense.category]?.text || "text-gray-500")} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-text-primary truncate">{expense.description}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <Badge className={cn("text-[8px] font-black uppercase tracking-widest border", CATEGORY_COLORS[expense.category]?.bg, CATEGORY_COLORS[expense.category]?.text)}>
                                                {expense.category}
                                            </Badge>
                                            {expense.project && (
                                                <span className="text-[10px] text-text-muted font-bold">{expense.project.emoji} {expense.project.name}</span>
                                            )}
                                            <span className="text-[10px] text-text-muted">{format(new Date(expense.date), "MMM d, yyyy")}</span>
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-red-500 shrink-0">
                                        -{formatCurrency(expense.amount, expense.currency)}
                                    </span>
                                    <button onClick={() => handleDelete(expense.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </Card>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Breakdown Chart */}
                <div>
                    <Card className="p-6 shadow-sm sticky top-20">
                        <h3 className="font-display font-bold text-text-primary mb-6">Expense Breakdown</h3>
                        {categoryData.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-text-muted text-sm italic">No data</div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="value"
                                            nameKey="name"
                                            stroke="none"
                                        >
                                            {categoryData.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => [formatCurrency(value), undefined]}
                                            contentStyle={{
                                                backgroundColor: "var(--bg-surface)",
                                                borderColor: "var(--border)",
                                                borderRadius: "12px",
                                                fontSize: "12px",
                                                fontWeight: 700,
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-2 mt-4">
                                    {categoryData.sort((a, b) => b.value - a.value).map((cat, i) => (
                                        <div key={cat.name} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-bg-hover/50">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                <span className="text-[10px] font-black text-text-secondary uppercase tracking-tight">{cat.name}</span>
                                            </div>
                                            <span className="text-[11px] font-black text-text-primary">{formatCurrency(cat.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </Card>
                </div>
            </div>

            {showModal && (
                <ExpenseFormModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); fetchExpenses(); }} />
            )}
        </div>
    );
}

function ExpenseFormModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState<number | "">("");
    const [currency, setCurrency] = useState("INR");
    const [category, setCategory] = useState("OTHER");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [notes, setNotes] = useState("");
    const [receiptUrl, setReceiptUrl] = useState("");

    const handleSubmit = async () => {
        if (!description || !amount) return toast.error("Description and amount are required");
        setLoading(true);
        try {
            const res = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description, amount: Number(amount), currency, category, date,
                    receiptUrl: receiptUrl || null, notes: notes || null,
                }),
            });
            if (res.ok) { toast.success("Expense added! 🎉"); onSuccess(); }
            else { const err = await res.json(); toast.error(err.error || "Failed"); }
        } catch { toast.error("Failed"); } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-lg font-display font-bold text-text-primary">New Expense</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-hover text-text-muted"><span className="text-lg">×</span></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">Description *</label>
                        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="AWS hosting fee" className="w-full px-3 py-2.5 bg-bg-base border border-border rounded-xl text-sm font-medium text-text-primary placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">Amount *</label>
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")} placeholder="0.00" min={0} className="w-full px-3 py-2.5 bg-bg-base border border-border rounded-xl text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">Currency</label>
                            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2.5 bg-bg-base border border-border rounded-xl text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30">
                                {CURRENCY_LIST.map((c) => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">Category</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2.5 bg-bg-base border border-border rounded-xl text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30">
                                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">Date</label>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2.5 bg-bg-base border border-border rounded-xl text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">Receipt URL</label>
                        <input value={receiptUrl} onChange={(e) => setReceiptUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 bg-bg-base border border-border rounded-xl text-sm font-medium text-text-primary placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">Notes</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." className="w-full px-3 py-2.5 bg-bg-base border border-border rounded-xl text-sm font-medium text-text-primary placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none h-16" />
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-bg-hover/30 rounded-b-2xl">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} loading={loading}>Add Expense</Button>
                </div>
            </div>
        </div>
    );
}
