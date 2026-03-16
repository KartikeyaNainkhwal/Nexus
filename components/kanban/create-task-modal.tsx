"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Task, TaskStatus, TaskPriority, User } from "@/types";

/* ── Priority options ── */
const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: "HIGH", label: "High", color: "#ef4444" },
  { value: "MEDIUM", label: "Medium", color: "#f59e0b" },
  { value: "LOW", label: "Low", color: "#10b981" },
];

/* ── Status options ── */
const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "DONE", label: "Done" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  members: { user: User }[];
  /** Pre-selected status when opening from a column header */
  defaultStatus?: TaskStatus;
  onSuccess: (task: Task) => void;
}

export function CreateTaskModal({
  open,
  onOpenChange,
  projectId,
  members,
  defaultStatus = "TODO",
  onSuccess,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setStatus(defaultStatus);
      setPriority("MEDIUM");
      setAssigneeId(null);
      setDueDate("");
    }
  }, [open, defaultStatus]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;

      setLoading(true);
      try {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            status,
            priority,
            projectId,
            assigneeId,
            dueDate: dueDate || null,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Failed to create task");
        }

        const task = await res.json();
        toast.success("Task created");
        onSuccess(task);
        onOpenChange(false);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [title, description, status, priority, projectId, assigneeId, dueDate, onSuccess, onOpenChange]
  );

  const inputCls =
    "w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-colors";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-white/[0.08] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-text-primary font-display">
            Create Task
          </DialogTitle>
          <DialogDescription className="text-text-muted text-sm">
            Add a new task to this project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              className={inputCls}
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">
              Description
            </label>
            <textarea
              className={cn(inputCls, "min-h-[80px] resize-none")}
              placeholder="Add details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Status + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Status */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">
                Status
              </label>
              <select
                className={cn(inputCls, "appearance-none")}
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">
                Priority
              </label>
              <div className="flex gap-1">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={cn(
                      "flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-all",
                      priority === p.value
                        ? "text-white"
                        : "bg-white/[0.04] text-text-muted hover:bg-white/[0.06]"
                    )}
                    style={
                      priority === p.value
                        ? { backgroundColor: p.color }
                        : undefined
                    }
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Assignee + Due date row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Assignee */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">
                Assignee
              </label>
              <select
                className={cn(inputCls, "appearance-none")}
                value={assigneeId ?? ""}
                onChange={(e) => setAssigneeId(e.target.value || null)}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">
                Due Date
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type="date"
                  className={cn(inputCls, "pl-9")}
                  value={dueDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-text-muted"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
