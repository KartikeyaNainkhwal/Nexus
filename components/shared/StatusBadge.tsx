"use client";

import { cn } from "@/lib/utils";

type Status = "todo" | "in_progress" | "in_review" | "done";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { label: string; dotClass: string; bgClass: string; textClass: string }> = {
  todo: {
    label: "To Do",
    dotClass: "bg-text-muted",
    bgClass: "bg-text-muted/10",
    textClass: "text-text-muted",
  },
  in_progress: {
    label: "In Progress",
    dotClass: "bg-accent",
    bgClass: "bg-accent/10",
    textClass: "text-accent",
  },
  in_review: {
    label: "In Review",
    dotClass: "bg-warning",
    bgClass: "bg-warning/10",
    textClass: "text-warning",
  },
  done: {
    label: "Done",
    dotClass: "bg-success",
    bgClass: "bg-success/10",
    textClass: "text-success",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        cfg.bgClass,
        cfg.textClass,
        className
      )}
    >
      <span
        aria-hidden
        className={cn("h-1.5 w-1.5 rounded-full animate-pulse-dot", cfg.dotClass)}
      />
      {cfg.label}
    </span>
  );
}
