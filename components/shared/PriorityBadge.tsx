"use client";

import { cn } from "@/lib/utils";

type Priority = "low" | "medium" | "high" | "urgent";

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

const priorityConfig: Record<Priority, { label: string; dotClass: string }> = {
  low: { label: "Low", dotClass: "bg-text-muted" },
  medium: { label: "Medium", dotClass: "bg-accent" },
  high: { label: "High", dotClass: "bg-warning" },
  urgent: { label: "Urgent", dotClass: "bg-danger" },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const cfg = priorityConfig[priority];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-text-muted",
        className
      )}
    >
      <span aria-hidden className={cn("h-2 w-2 rounded-full", cfg.dotClass)} />
      {cfg.label}
    </span>
  );
}
