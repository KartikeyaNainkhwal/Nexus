"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, CheckCircle2, Circle } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types";

interface Subtask {
    id: string;
    title: string;
    status: TaskStatus;
}

export function TaskSubtasks({ taskId, projectId }: { taskId: string; projectId: string }) {
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetch(`/api/tasks?projectId=${projectId}&parentTaskId=${taskId}`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setSubtasks(data);
            })
            .finally(() => setLoading(false));
    }, [taskId, projectId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        setCreating(true);
        try {
            const res = await fetch(`/api/tasks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newTitle.trim(),
                    projectId,
                    parentTaskId: taskId,
                    status: "TODO"
                }),
            });
            if (!res.ok) throw new Error("Failed to create subtask");
            const saved = await res.json();
            setSubtasks((prev) => [...prev, saved]);
            setNewTitle("");
            setIsAdding(false);
        } catch {
            toast.error("Failed to create subtask");
        } finally {
            setCreating(false);
        }
    };

    const toggleStatus = async (subtask: Subtask) => {
        const newStatus = subtask.status === "DONE" ? "TODO" : "DONE";
        // Optimistic
        setSubtasks(prev => prev.map(s => s.id === subtask.id ? { ...s, status: newStatus } : s));

        try {
            const res = await fetch(`/api/tasks/${subtask.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error();
        } catch {
            toast.error("Failed to update status");
            // Revert
            setSubtasks(prev => prev.map(s => s.id === subtask.id ? { ...s, status: subtask.status } : s));
        }
    };

    if (loading) return <div className="py-2 text-center"><Loader2 className="w-4 h-4 mx-auto animate-spin text-text-muted" /></div>;

    const completedCount = subtasks.filter(s => s.status === "DONE").length;
    const totalCount = subtasks.length;
    const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Subtasks
                </h3>
                {totalCount > 0 && (
                    <span className="text-[10px] font-medium text-text-muted">
                        {completedCount}/{totalCount} ({progress}%)
                    </span>
                )}
            </div>

            {totalCount > 0 && (
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 transition-all duration-300 ease-in-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            <div className="space-y-2">
                {subtasks.map(subtask => (
                    <div key={subtask.id} className="flex items-start gap-2.5 p-2 rounded-md hover:bg-white/[0.02] transition-colors group">
                        <button
                            onClick={() => toggleStatus(subtask)}
                            className={cn(
                                "mt-0.5 shrink-0 transition-colors",
                                subtask.status === "DONE" ? "text-emerald-500" : "text-text-muted hover:text-white"
                            )}
                        >
                            {subtask.status === "DONE" ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                <Circle className="h-4 w-4" />
                            )}
                        </button>
                        <span className={cn(
                            "text-sm",
                            subtask.status === "DONE" ? "text-text-muted line-through" : "text-text-primary"
                        )}>
                            {subtask.title}
                        </span>
                    </div>
                ))}

                {isAdding ? (
                    <form onSubmit={handleCreate} className="flex items-center gap-2 mt-2">
                        <input
                            autoFocus
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="What needs to be done?"
                            className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-md px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted/50 outline-none focus:border-accent/30 transition-colors"
                        />
                        <div className="flex items-center gap-1">
                            <Button type="submit" size="sm" disabled={!newTitle.trim() || creating} className="h-7 px-2.5 text-[10px]">
                                {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="h-7 px-2 text-[10px] text-text-muted">
                                Cancel
                            </Button>
                        </div>
                    </form>
                ) : (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAdding(true)}
                        className="text-text-muted hover:text-white hover:bg-white/[0.04] h-8 text-xs w-full justify-start mt-1"
                    >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Add Subtask
                    </Button>
                )}
            </div>
        </div>
    );
}
