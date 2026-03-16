"use client";

import { motion } from "framer-motion";
// Avatar components available if needed for enhanced activity feed
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FolderPlus,
  CheckCircle2,
  UserPlus,
  Pencil,
  Trash2,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import type { ActivityEntry } from "@/lib/dashboard-data";

interface Props {
  entries: ActivityEntry[];
}

/* ── Map action verbs to icons / colors ── */
const actionConfig: Record<string, { icon: LucideIcon; colorClass: string }> = {
  created: { icon: FolderPlus, colorClass: "text-success bg-success/10" },
  completed: { icon: CheckCircle2, colorClass: "text-success bg-success/10" },
  updated: { icon: Pencil, colorClass: "text-accent bg-accent/10" },
  deleted: { icon: Trash2, colorClass: "text-danger bg-danger/10" },
  added: { icon: UserPlus, colorClass: "text-accent-light bg-accent-light/10" },
  invited: { icon: UserPlus, colorClass: "text-accent-light bg-accent-light/10" },
  commented: { icon: MessageSquare, colorClass: "text-warning bg-warning/10" },
};

function getActionConfig(action: string) {
  const key = action.toLowerCase();
  for (const [k, v] of Object.entries(actionConfig)) {
    if (key.includes(k)) return v;
  }
  return { icon: Pencil, colorClass: "text-text-muted bg-bg-hover" };
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityFeed({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-text-muted">
        No activity yet.
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Vertical connecting line */}
      <div
        className="absolute left-[19px] top-4 bottom-4 w-px"
        style={{ background: "rgba(255,255,255,0.06)" }}
      />

      {entries.map((entry, i) => {
        const cfg = getActionConfig(entry.action);
        const Icon = cfg.icon;

        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className="relative flex gap-3 py-3"
          >
            {/* Icon */}
            <div
              className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cfg.colorClass}`}
            >
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm text-text-primary leading-snug">
                <span className="font-medium text-white">
                  {entry.user.name}
                </span>{" "}
                <span className="text-text-muted">{entry.action}</span>{" "}
                <span className="font-medium text-white">{entry.entity}</span>
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                {timeAgo(entry.createdAt)}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
