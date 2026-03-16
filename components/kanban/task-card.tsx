"use client";

import { memo } from "react";
import {
  Draggable,
  type DraggableProvided,
  type DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  GripVertical,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import type { Task } from "@/types";

/* ── Priority styling ── */
const PRIORITY_BORDER: Record<string, string> = {
  HIGH: "#ef4444",
  MEDIUM: "#f59e0b",
  LOW: "#10b981",
};

const PRIORITY_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  HIGH: { bg: "bg-red-500/10", text: "text-red-400", label: "High" },
  MEDIUM: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Medium" },
  LOW: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Low" },
};

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function formatDate(d: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(d));
}

interface Props {
  task: Task;
  index: number;
  onClick?: (task: Task) => void;
}

function TaskCardInner({ task, index, onClick }: Props) {
  const overdue = task.status !== "DONE" && isOverdue(task.dueDate);
  const badge = PRIORITY_BADGE[task.priority];

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "group relative rounded-lg border border-border bg-bg-surface transition-all duration-150 cursor-pointer",
            snapshot.isDragging
              ? "rotate-[2deg] scale-[1.02] shadow-2xl shadow-accent/10 border-accent/30 z-50"
              : "border-white/[0.06] hover:border-white/[0.12] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
          )}
          style={{
            ...provided.draggableProps.style,
            borderLeftWidth: "3px",
            borderLeftColor: PRIORITY_BORDER[task.priority],
          }}
          onClick={() => onClick?.(task)}
        >
          {/* Drag handle */}
          <div
            {...provided.dragHandleProps}
            className="absolute right-2 top-2 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-text-muted" />
          </div>

          <div className="p-3 space-y-2">
            {/* Title */}
            <p className="text-sm font-medium text-text-primary pr-6 leading-snug">
              {task.title}
            </p>

            {/* Description preview */}
            {task.description && (
              <p className="text-xs text-text-muted line-clamp-1 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Bottom row */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {/* Assignee */}
              {task.assignedTo && (
                <Avatar className="h-5 w-5">
                  <AvatarImage src={task.assignedTo.avatar ?? undefined} />
                  <AvatarFallback className="text-[9px] bg-accent/20 text-accent-light">
                    {task.assignedTo.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              )}

              {/* Due date */}
              {task.dueDate && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    overdue
                      ? "bg-red-500/10 text-red-400"
                      : "bg-white/[0.04] text-text-muted"
                  )}
                >
                  {overdue ? (
                    <AlertTriangle className="h-3 w-3" />
                  ) : (
                    <Calendar className="h-3 w-3" />
                  )}
                  {formatDate(task.dueDate)}
                </span>
              )}

              {/* Priority */}
              <span
                className={cn(
                  "ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium",
                  badge.bg,
                  badge.text
                )}
              >
                {badge.label}
              </span>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export const TaskCard = memo(TaskCardInner);
