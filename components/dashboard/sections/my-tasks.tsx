"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Calendar, ArrowRight } from "lucide-react";
import type { MyTask } from "@/lib/dashboard-data";

interface Props {
  tasks: MyTask[];
}

const priorityDot: Record<string, string> = {
  HIGH: "bg-danger",
  MEDIUM: "bg-warning",
  LOW: "bg-text-muted",
};

function formatDueDate(date: Date | null): { label: string; urgent: boolean } {
  if (!date) return { label: "No due date", urgent: false };
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return { label: `${Math.abs(days)}d overdue`, urgent: true };
  if (days === 0) return { label: "Due today", urgent: true };
  if (days === 1) return { label: "Due tomorrow", urgent: false };
  return { label: `Due in ${days}d`, urgent: false };
}

export function MyTasksSection({ tasks }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border py-12 text-sm text-text-muted" style={{ background: "var(--bg-hover)" }}>
        🎉 You&apos;re all caught up! No tasks assigned.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task, i) => {
        const due = formatDueDate(task.dueDate);
        return (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className="glass glass-hover flex items-center gap-4 rounded-xl px-4 py-3"
          >
            {/* Priority dot */}
            <span
              className={cn(
                "h-2.5 w-2.5 shrink-0 rounded-full",
                priorityDot[task.priority] ?? "bg-text-muted"
              )}
            />

            {/* Task info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {task.title}
              </p>
              <p className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                <span>{task.project.emoji}</span>
                <span>{task.project.name}</span>
              </p>
            </div>

            {/* Due date badge */}
            <span
              className={cn(
                "hidden sm:inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium",
                due.urgent
                  ? "bg-danger/10 text-danger"
                  : "bg-bg-hover text-text-muted"
              )}
            >
              <Calendar className="h-3 w-3" />
              {due.label}
            </span>
          </motion.div>
        );
      })}

      {/* View all link */}
      <Link
        href="/dashboard/tasks"
        className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-accent hover:text-accent-light transition-colors"
      >
        View all tasks
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
