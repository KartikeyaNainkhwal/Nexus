"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Clock,
  Flag,
  User as UserIcon,
  Trash2,
  Loader2,
  CheckCircle2,
  Circle,
  ArrowRight,
  Eye,
  AlertTriangle,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Task, TaskStatus, TaskPriority, User } from "@/types";
import { TaskComments } from "./task-comments";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

/* ── Config ── */
const STATUS_CONFIG: {
  value: TaskStatus;
  label: string;
  icon: typeof Circle;
  color: string;
}[] = [
    { value: "TODO", label: "To Do", icon: Circle, color: "#64748b" },
    { value: "IN_PROGRESS", label: "In Progress", icon: Clock, color: "#6366f1" },
    { value: "IN_REVIEW", label: "In Review", icon: Eye, color: "#f59e0b" },
    { value: "DONE", label: "Done", icon: CheckCircle2, color: "#10b981" },
  ];

const PRIORITY_CONFIG: {
  value: TaskPriority;
  label: string;
  color: string;
  bg: string;
}[] = [
    { value: "HIGH", label: "High", color: "#ef4444", bg: "bg-red-500/10" },
    { value: "MEDIUM", label: "Medium", color: "#f59e0b", bg: "bg-amber-500/10" },
    { value: "LOW", label: "Low", color: "#10b981", bg: "bg-emerald-500/10" },
  ];

interface Props {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: { user: User }[];
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  members,
  onUpdate,
  onDelete,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync local state with task prop
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setShowDeleteConfirm(false);
    }
  }, [task]);

  const saveField = useCallback(
    async (field: string, value: unknown) => {
      if (!task) return;
      setSaving(true);
      try {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        });
        if (!res.ok) throw new Error("Failed to save");
        const updated = await res.json();
        onUpdate(task.id, updated);
      } catch {
        toast.error("Failed to save changes");
      } finally {
        setSaving(false);
      }
    },
    [task, onUpdate]
  );

  const handleTitleBlur = () => {
    if (task && title.trim() !== task.title) {
      saveField("title", title.trim());
    }
  };

  const handleDescBlur = () => {
    if (task && description.trim() !== (task.description ?? "")) {
      saveField("description", description.trim() || null);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Task deleted");
      onDelete(task.id);
      onOpenChange(false);
    } catch {
      toast.error("Failed to delete task");
    } finally {
      setDeleting(false);
    }
  };

  if (!task) return null;

  const currentStatus = STATUS_CONFIG.find((s) => s.value === task.status);
  const overdue =
    task.status !== "DONE" &&
    task.dueDate &&
    new Date(task.dueDate) < new Date();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 overflow-y-auto border-l"
        style={{
          background: "rgba(8,8,16,0.98)",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <div className="flex items-start justify-between gap-4">
            <SheetTitle className="sr-only">Task Details</SheetTitle>
            <div className="flex-1 min-w-0">
              {/* Status badge */}
              <div className="flex items-center gap-2 mb-3">
                {currentStatus && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      color: currentStatus.color,
                      background: `${currentStatus.color}15`,
                    }}
                  >
                    <currentStatus.icon className="h-3 w-3" />
                    {currentStatus.label}
                  </span>
                )}
                {saving && (
                  <span className="text-[10px] text-text-muted flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving…
                  </span>
                )}
              </div>

              {/* Editable title */}
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                className="w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-text-muted focus:ring-0 border-b border-transparent focus:border-accent/30 transition-colors pb-1"
                placeholder="Task title..."
              />
            </div>
          </div>
        </SheetHeader>

        <div className="px-6 py-5 space-y-6">
          {/* ── Properties grid ── */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Properties
            </h3>

            <div className="space-y-3">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted flex items-center gap-2">
                  <ArrowRight className="h-3.5 w-3.5" />
                  Status
                </span>
                <div className="flex gap-1">
                  {STATUS_CONFIG.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => saveField("status", s.value)}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-[11px] font-medium transition-all",
                        task.status === s.value
                          ? "text-white"
                          : "text-text-muted hover:text-white hover:bg-white/[0.06]"
                      )}
                      style={
                        task.status === s.value
                          ? { background: `${s.color}25`, color: s.color }
                          : undefined
                      }
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted flex items-center gap-2">
                  <Flag className="h-3.5 w-3.5" />
                  Priority
                </span>
                <div className="flex gap-1">
                  {PRIORITY_CONFIG.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => saveField("priority", p.value)}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-[11px] font-medium transition-all",
                        task.priority === p.value
                          ? "text-white"
                          : "text-text-muted hover:text-white hover:bg-white/[0.06]"
                      )}
                      style={
                        task.priority === p.value
                          ? { background: `${p.color}25`, color: p.color }
                          : undefined
                      }
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assignee */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted flex items-center gap-2">
                  <UserIcon className="h-3.5 w-3.5" />
                  Assignee
                </span>
                <select
                  value={task.assignedTo?.id ?? ""}
                  onChange={(e) =>
                    saveField("assigneeId", e.target.value || null)
                  }
                  className="bg-white/[0.04] border border-white/[0.08] rounded-md px-2.5 py-1 text-xs text-text-primary outline-none focus:border-accent/40 transition-colors max-w-[180px]"
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
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  Due Date
                </span>
                <div className="flex items-center gap-2">
                  {overdue && (
                    <AlertTriangle className="h-3.5 w-3.5 text-danger" />
                  )}
                  <input
                    type="date"
                    value={
                      task.dueDate
                        ? new Date(task.dueDate).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      saveField("dueDate", e.target.value || null)
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className="bg-white/[0.04] border border-white/[0.08] rounded-md px-2.5 py-1 text-xs text-text-primary outline-none focus:border-accent/40 transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Description ── */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Description
            </h3>
            <div onBlur={handleDescBlur}>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Add a detailed description… Type '/' for commands"
              />
            </div>
          </div>

          {/* ── Task info ── */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Details
            </h3>
            <div className="space-y-2 text-xs text-text-muted">
              {task.createdBy && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={task.createdBy.avatar ?? undefined} />
                    <AvatarFallback className="text-[8px] bg-accent/20 text-accent-light">
                      {task.createdBy.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  Created by {task.createdBy.name}
                </div>
              )}
              {task.assignedTo && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={task.assignedTo.avatar ?? undefined} />
                    <AvatarFallback className="text-[8px] bg-accent/20 text-accent-light">
                      {task.assignedTo.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  Assigned to {task.assignedTo.name}
                </div>
              )}
              {task.createdAt && (
                <p>
                  Created{" "}
                  {new Date(task.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06]">
            <TaskComments taskId={task.id} />
          </div>

          {/* ── Danger zone ── */}
          <div className="pt-4 border-t border-white/[0.06]">
            <AnimatePresence mode="wait">
              {showDeleteConfirm ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2"
                >
                  <p className="text-xs text-danger flex-1">
                    Are you sure? This cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="h-7 text-xs"
                  >
                    {deleting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="h-7 text-xs"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-danger/60 hover:text-danger hover:bg-danger/10 h-8 text-xs"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete Task
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
