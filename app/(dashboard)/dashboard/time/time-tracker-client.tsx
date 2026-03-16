"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Play, Square, Clock, DollarSign, BarChart3, Zap, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Project { id: string; name: string; emoji: string; color: string; }
interface TaskInfo { id: string; title: string; }
interface TimeEntry {
    id: string;
    description: string | null;
    startTime: string;
    endTime: string | null;
    duration: number | null;
    billable: boolean;
    hourlyRate: number | null;
    task: TaskInfo | null;
    project: Project | null;
}

interface Stats {
    totalHours: number;
    billableHours: number;
    utilizationRate: number;
    weeklyProgress: number;
    targetHours: number;
    dailyHours: { day: string; total: number; billable: number }[];
    projectBreakdown: { name: string; emoji: string; color: string; hours: number }[];
    todayEntries: TimeEntry[];
    todayTotal: number;
    weeklyEarnings: number;
}

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

const BAR_COLORS = ["#e2e8f0", "#3b82f6", "#3b82f6", "#3b82f6", "#3b82f6", "#3b82f6", "#e2e8f0"];

export function TimeTrackerClient() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [runningEntry, setRunningEntry] = useState<TimeEntry | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [description, setDescription] = useState("");
    const [starting, setStarting] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchStats = useCallback(() => {
        fetch("/api/productivity/stats")
            .then((r) => r.json())
            .then((data) => setStats(data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const fetchRunning = useCallback(() => {
        fetch("/api/time-entries/running")
            .then((r) => r.json())
            .then((data) => {
                if (data && data.id) {
                    setRunningEntry(data);
                    setDescription(data.description || "");
                } else {
                    setRunningEntry(null);
                }
            });
    }, []);

    useEffect(() => {
        fetchStats();
        fetchRunning();
    }, [fetchStats, fetchRunning]);

    // Live timer
    useEffect(() => {
        if (runningEntry) {
            const startMs = new Date(runningEntry.startTime).getTime();
            const tick = () => {
                setElapsed(Math.floor((Date.now() - startMs) / 1000));
            };
            tick();
            timerRef.current = setInterval(tick, 1000);
            return () => { if (timerRef.current) clearInterval(timerRef.current); };
        } else {
            setElapsed(0);
        }
    }, [runningEntry]);

    const handleStart = async () => {
        setStarting(true);
        try {
            const res = await fetch("/api/time-entries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description: description || "Working...", billable: true }),
            });
            if (res.ok) {
                const entry = await res.json();
                setRunningEntry(entry);
                toast.success("Timer started! ⏱️");
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to start");
            }
        } catch { toast.error("Failed to start timer"); }
        finally { setStarting(false); }
    };

    const handleStop = async () => {
        try {
            const res = await fetch("/api/time-entries/stop", { method: "POST" });
            if (res.ok) {
                setRunningEntry(null);
                setDescription("");
                toast.success("Timer stopped! ✅");
                fetchStats();
            }
        } catch { toast.error("Failed to stop timer"); }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/time-entries/${id}`, { method: "DELETE" });
            if (res.ok) { toast.success("Entry deleted"); fetchStats(); }
        } catch { toast.error("Failed"); }
    };

    if (loading) {
        return (
            <div className="space-y-8 max-w-7xl mx-auto animate-pulse">
                <div className="h-8 w-48 bg-bg-hover rounded-lg" />
                <div className="h-[200px] bg-bg-surface border border-border rounded-2xl" />
                <div className="grid grid-cols-4 gap-6">{[1, 2, 3, 4].map(i => <div key={i} className="h-[120px] bg-bg-surface border border-border rounded-2xl" />)}</div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <PageHeader heading="Time Tracker" description="Track billable hours and monitor productivity" />

            {/* ── LIVE TIMER WIDGET ── */}
            <Card className="p-0 overflow-hidden shadow-lg border-2 border-accent/20">
                <div className={cn(
                    "p-8 transition-all",
                    runningEntry
                        ? "bg-gradient-to-r from-accent/5 via-transparent to-emerald-500/5"
                        : "bg-bg-surface"
                )}>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Timer Display */}
                        <div className="flex-shrink-0 text-center">
                            <p className={cn(
                                "font-mono text-5xl font-black tracking-wider tabular-nums",
                                runningEntry ? "text-accent" : "text-text-subtle"
                            )}>
                                {formatDuration(elapsed)}
                            </p>
                            {runningEntry && (
                                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-2 flex items-center justify-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Recording
                                </p>
                            )}
                        </div>

                        {/* Description + Controls */}
                        <div className="flex-1 w-full flex flex-col sm:flex-row gap-4 items-center">
                            <input
                                type="text"
                                placeholder="What are you working on?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={!!runningEntry}
                                className="flex-1 w-full px-4 py-3 bg-bg-base border border-border rounded-xl text-sm font-medium text-text-primary placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
                            />
                            {runningEntry ? (
                                <Button onClick={handleStop} className="bg-red-500 hover:bg-red-600 border-red-500 text-white shrink-0 h-12 px-8 text-sm font-black">
                                    <Square className="h-4 w-4 mr-2 fill-white" /> Stop
                                </Button>
                            ) : (
                                <Button onClick={handleStart} loading={starting} className="bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white shrink-0 h-12 px-8 text-sm font-black">
                                    <Play className="h-4 w-4 mr-2 fill-white" /> Start
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* ── METRIC CARDS ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricBox
                    label="Today"
                    value={formatHours(stats.todayTotal)}
                    icon={<Clock className="h-5 w-5" />}
                    iconBg="bg-blue-50 text-blue-600"
                />
                <MetricBox
                    label="This Week"
                    value={`${stats.totalHours}h / ${stats.targetHours}h`}
                    icon={<BarChart3 className="h-5 w-5" />}
                    iconBg="bg-indigo-50 text-indigo-600"
                    sub={<div className="w-full h-1.5 bg-bg-hover rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(stats.weeklyProgress, 100)}%` }} />
                    </div>}
                />
                <MetricBox
                    label="Utilization"
                    value={`${stats.utilizationRate}%`}
                    icon={<Zap className="h-5 w-5" />}
                    iconBg={cn("text-white", stats.utilizationRate >= 70 ? "bg-emerald-500" : stats.utilizationRate >= 40 ? "bg-amber-500" : "bg-red-400")}
                />
                <MetricBox
                    label="Earnings"
                    value={formatCurrency(stats.weeklyEarnings)}
                    icon={<DollarSign className="h-5 w-5" />}
                    iconBg="bg-emerald-50 text-emerald-600"
                />
            </div>

            {/* ── CHARTS ROW ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Daily Hours Chart */}
                <Card className="lg:col-span-2 p-6 shadow-sm">
                    <h3 className="font-display font-bold text-text-primary mb-6">Weekly Hours</h3>
                    <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.dailyHours}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tick={{ fontWeight: 700 }} />
                                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tick={{ fontWeight: 700 }} tickFormatter={(v) => `${v}h`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", borderRadius: "12px", fontSize: "12px", fontWeight: 700 }}
                                    formatter={(value: number) => [`${value}h`, undefined]}
                                />
                                <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={32} name="Total">
                                    {stats.dailyHours.map((_, i) => (
                                        <Cell key={i} fill={BAR_COLORS[i]} />
                                    ))}
                                </Bar>
                                <Bar dataKey="billable" radius={[8, 8, 0, 0]} barSize={20} fill="#10b981" opacity={0.6} name="Billable" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-2 text-xs font-bold text-text-muted"><div className="h-2 w-6 rounded-full bg-blue-500" /> Total</div>
                        <div className="flex items-center gap-2 text-xs font-bold text-text-muted"><div className="h-2 w-6 rounded-full bg-emerald-500" /> Billable</div>
                    </div>
                </Card>

                {/* Project Breakdown */}
                <Card className="p-6 shadow-sm">
                    <h3 className="font-display font-bold text-text-primary mb-6">By Project</h3>
                    {stats.projectBreakdown.length === 0 ? (
                        <div className="flex items-center justify-center h-40 text-sm text-text-muted italic">No entries this week</div>
                    ) : (
                        <div className="space-y-4">
                            {stats.projectBreakdown.map((p) => {
                                const pct = stats!.totalHours > 0 ? (p.hours / stats!.totalHours) * 100 : 0;
                                return (
                                    <div key={p.name}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-bold text-text-primary truncate">{p.emoji} {p.name}</span>
                                            <span className="text-xs font-black text-text-primary shrink-0">{formatHours(p.hours)}</span>
                                        </div>
                                        <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </div>

            {/* ── TODAY'S ENTRIES ── */}
            <Card className="p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display font-bold text-text-primary">Today&apos;s Entries</h3>
                    <Badge className="bg-bg-hover text-text-muted border-border">{stats.todayEntries.length} entries</Badge>
                </div>
                {stats.todayEntries.length === 0 ? (
                    <div className="text-center py-12 text-text-muted text-sm italic">No time tracked today. Start a timer above!</div>
                ) : (
                    <div className="space-y-2">
                        {stats.todayEntries.map((entry) => (
                            <div key={entry.id} className="flex items-center gap-4 p-3 rounded-xl bg-bg-hover/50 hover:bg-bg-hover transition-all group">
                                {entry.project && (
                                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: entry.project.color + "20" }}>
                                        {entry.project.emoji}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-text-primary truncate">{entry.description || "Untitled"}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {entry.project && <span className="text-[10px] text-text-muted font-bold">{entry.project.name}</span>}
                                        {entry.task && <span className="text-[10px] text-accent font-bold">• {entry.task.title}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    {entry.billable && (
                                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[8px] font-black">BILLABLE</Badge>
                                    )}
                                    <span className={cn(
                                        "font-mono text-sm font-black tabular-nums",
                                        entry.endTime ? "text-text-primary" : "text-emerald-500"
                                    )}>
                                        {entry.duration ? formatDuration(entry.duration) : "Running..."}
                                    </span>
                                    {entry.endTime && (
                                        <button onClick={() => handleDelete(entry.id)} className="p-1 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}

function MetricBox({ label, value, icon, iconBg, sub }: {
    label: string; value: string; icon: React.ReactNode; iconBg: string; sub?: React.ReactNode;
}) {
    return (
        <Card className="p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", iconBg)}>{icon}</div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.15em]">{label}</p>
            </div>
            <p className="text-xl font-black text-text-primary tracking-tight">{value}</p>
            {sub}
        </Card>
    );
}
