"use client";

import { useEffect, useState } from "react";
import { Plus, Target, Trophy, Flame, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency, CURRENCY_LIST } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface Goal {
    id: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    currency: string;
    period: string;
    startDate: string;
    endDate: string;
}

export function GoalsClient() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const fetchGoals = () => {
        setLoading(true);
        fetch("/api/goals")
            .then((r) => r.json())
            .then((data) => setGoals(Array.isArray(data) ? data : []))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchGoals(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this goal?")) return;
        try {
            const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
            if (res.ok) { toast.success("Goal deleted"); fetchGoals(); }
        } catch { toast.error("Failed"); }
    };

    // Count completed goals for streak
    const completedGoals = goals.filter((g) => g.currentAmount >= g.targetAmount).length;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <PageHeader heading="Income Goals" description="Set targets and watch your progress grow">
                <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowModal(true)}>
                    New Goal
                </Button>
            </PageHeader>

            {/* Streak Banner */}
            {completedGoals > 0 && (
                <Card className="p-5 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-amber-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                            <Flame className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-amber-800">🔥 {completedGoals} Goal{completedGoals > 1 ? "s" : ""} Achieved!</p>
                            <p className="text-xs text-amber-600 font-medium">Keep the momentum going. Set new targets to push further.</p>
                        </div>
                    </div>
                </Card>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => <div key={i} className="h-[220px] bg-bg-surface border border-border rounded-2xl animate-pulse" />)}
                </div>
            ) : goals.length === 0 ? (
                <Card className="p-16 text-center">
                    <Target className="h-14 w-14 text-text-subtle mx-auto mb-4" />
                    <p className="text-lg font-bold text-text-muted mb-2">No goals set yet</p>
                    <p className="text-sm text-text-subtle mb-6">Create your first income goal to start tracking progress</p>
                    <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowModal(true)}>Set a Goal</Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {goals.map((goal) => {
                        const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
                        const isComplete = pct >= 100;
                        const isActive = new Date(goal.endDate) >= new Date();

                        return (
                            <Card key={goal.id} className={cn("p-6 shadow-sm overflow-hidden relative group", isComplete && "ring-2 ring-emerald-400 border-emerald-200")}>
                                {isComplete && (
                                    <div className="absolute top-3 right-3">
                                        <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                                            <Trophy className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-3 mb-5">
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                                        isComplete ? "bg-emerald-50 text-emerald-600" : "bg-accent/10 text-accent"
                                    )}>
                                        <Target className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-text-primary text-sm truncate">{goal.title}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge className={cn(
                                                "text-[8px] font-black uppercase tracking-widest",
                                                isComplete ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                    : isActive ? "bg-blue-50 text-blue-600 border-blue-200"
                                                        : "bg-gray-100 text-gray-500 border-gray-200"
                                            )}>
                                                {isComplete ? "✅ ACHIEVED" : isActive ? "Active" : "Expired"}
                                            </Badge>
                                            <span className="text-[9px] font-bold text-text-muted uppercase">{goal.period}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xl font-black text-text-primary">{formatCurrency(goal.currentAmount, goal.currency)}</span>
                                        <span className="text-xs font-bold text-text-muted">of {formatCurrency(goal.targetAmount, goal.currency)}</span>
                                    </div>
                                    <div className="h-3 bg-bg-hover rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className={cn(
                                                "h-full rounded-full",
                                                isComplete ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-accent to-[#8b5cf6]"
                                            )}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className={cn("text-xs font-black", isComplete ? "text-emerald-500" : "text-accent")}>{Math.round(pct)}%</span>
                                        <span className="text-[10px] font-bold text-text-muted">
                                            {format(new Date(goal.startDate), "MMM d")} — {format(new Date(goal.endDate), "MMM d, yyyy")}
                                        </span>
                                    </div>
                                </div>

                                {/* Remaining */}
                                {!isComplete && isActive && (
                                    <div className="p-3 bg-bg-hover/50 rounded-lg">
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                            Need {formatCurrency(goal.targetAmount - goal.currentAmount, goal.currency)} more to hit your target
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={() => handleDelete(goal.id)}
                                    className="absolute bottom-4 right-4 p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </Card>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <GoalFormModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); fetchGoals(); }} />
            )}
        </div>
    );
}

function GoalFormModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [targetAmount, setTargetAmount] = useState<number | "">("");
    const [currency, setCurrency] = useState("INR");
    const [period, setPeriod] = useState("MONTHLY");

    // Auto-set date range based on period
    const getDateRange = () => {
        const now = new Date();
        let start: Date, end: Date;
        if (period === "WEEKLY") {
            start = new Date(now);
            start.setDate(now.getDate() - now.getDay());
            end = new Date(start);
            end.setDate(start.getDate() + 6);
        } else if (period === "MONTHLY") {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else {
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
        }
        return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
    };

    const handleSubmit = async () => {
        if (!title || !targetAmount) return toast.error("Title and target amount are required");
        const dates = getDateRange();
        setLoading(true);
        try {
            const res = await fetch("/api/goals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, targetAmount: Number(targetAmount), currency, period, startDate: dates.start, endDate: dates.end }),
            });
            if (res.ok) { toast.success("Goal created! 🎯"); onSuccess(); }
            else { const err = await res.json(); toast.error(err.error || "Failed"); }
        } catch { toast.error("Failed"); } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center"><Target className="h-5 w-5 text-accent" /></div>
                        <h2 className="text-lg font-display font-bold text-text-primary">New Goal</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-hover text-text-muted"><span className="text-lg">×</span></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">Goal Title *</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Earn ₹5,00,000 this month" className="w-full px-3 py-2.5 bg-bg-base border border-border rounded-xl text-sm font-medium text-text-primary placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">Target Amount *</label>
                            <input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value ? Number(e.target.value) : "")} placeholder="500000" className="w-full px-3 py-2.5 bg-bg-base border border-border rounded-xl text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">Currency</label>
                            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2.5 bg-bg-base border border-border rounded-xl text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30">
                                {CURRENCY_LIST.map((c) => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">Period</label>
                        <div className="flex gap-3">
                            {["WEEKLY", "MONTHLY", "YEARLY"].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={cn(
                                        "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all",
                                        period === p ? "bg-accent text-white border-accent shadow-md" : "bg-bg-base text-text-muted border-border hover:border-accent/30"
                                    )}
                                >{p}</button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-bg-hover/30 rounded-b-2xl">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} loading={loading}>Create Goal</Button>
                </div>
            </div>
        </div>
    );
}
