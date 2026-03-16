import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isPast } from "date-fns";

// ── Class name helper ─────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Date formatting ───────────────────────────────────────────
/** "Mar 10, 2026" */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "MMM d, yyyy");
}

/** "2 hours ago" / "in 3 days" */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// ── String helpers ────────────────────────────────────────────
/** "Jordan Lee" → "JL" */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/** "Acme Corp" → "acme-corp" */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Task helpers ──────────────────────────────────────────────
/** Returns true if the given date is in the past */
export function isOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  return isPast(new Date(date));
}

// ── Plan config ───────────────────────────────────────────────
export type SubscriptionPlan = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

interface PlanLimits {
  members: number;
  projects: number;
}

const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  FREE: { members: 5, projects: 3 },
  STARTER: { members: 15, projects: 10 },
  PRO: { members: 100, projects: 50 },
  ENTERPRISE: { members: Infinity, projects: Infinity },
};

export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
}
