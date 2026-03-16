import type { Plan } from "@/types";

/* ═══════════════════════════════════════════════════════════
   Plan configuration  (client-safe — no DB imports, no env vars)
   ═══════════════════════════════════════════════════════════ */

export interface PlanConfig {
  name: string;
  price: number; // monthly, USD
  maxMembers: number; // -1 = unlimited
  maxProjects: number; // -1 = unlimited
  features: string[];
  /** Whether this plan has a paid checkout (resolved server-side) */
  hasPaidPlan: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanConfig> = {
  FREE: {
    name: "Free",
    price: 0,
    maxMembers: 2,
    maxProjects: 3,
    features: [
      "Up to 2 team members",
      "Up to 3 projects",
      "Basic task management",
      "Activity feed",
    ],
    hasPaidPlan: false,
  },
  STARTER: {
    name: "Starter",
    price: 9,
    maxMembers: 5,
    maxProjects: 10,
    features: [
      "Up to 5 team members",
      "Up to 10 projects",
      "Priority support",
      "Advanced analytics",
      "Custom project colors",
    ],
    hasPaidPlan: true,
  },
  PRO: {
    name: "Pro",
    price: 29,
    maxMembers: 25,
    maxProjects: -1,
    features: [
      "Up to 25 team members",
      "Unlimited projects",
      "Priority support",
      "Advanced analytics",
      "Custom branding",
      "API access",
    ],
    hasPaidPlan: true,
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 99,
    maxMembers: -1,
    maxProjects: -1,
    features: [
      "Unlimited team members",
      "Unlimited projects",
      "Dedicated support",
      "Advanced analytics",
      "Custom branding",
      "API access",
      "SSO & SAML",
      "Audit logs",
    ],
    hasPaidPlan: false, // contact sales
  },
};

/**
 * Server-only: resolve a Plan enum to its Razorpay plan ID from env vars.
 */
export function getPlanRazorpayId(plan: Plan): string | null {
  switch (plan) {
    case "STARTER":
      return process.env.RAZORPAY_STARTER_PLAN_ID ?? null;
    case "PRO":
      return process.env.RAZORPAY_PRO_PLAN_ID ?? null;
    default:
      return null;
  }
}

/* ═══════════════════════════════════════════════════════════
   PlanLimitError  (no DB dependency)
   ═══════════════════════════════════════════════════════════ */

export class PlanLimitError extends Error {
  public readonly code = "PLAN_LIMIT_REACHED";
  public readonly limit: number;
  public readonly current: number;
  public readonly resource: "members" | "projects";

  constructor(resource: "members" | "projects", current: number, limit: number) {
    super(
      `You've reached the ${resource} limit (${current}/${limit}) on your current plan. Please upgrade to add more.`
    );
    this.name = "PlanLimitError";
    this.resource = resource;
    this.current = current;
    this.limit = limit;
  }
}

/**
 * Map a Razorpay plan ID back to a Plan enum (used in webhook).
 */
export function razorpayPlanIdToPlan(razorpayPlanId: string): Plan {
  if (razorpayPlanId === process.env.RAZORPAY_STARTER_PLAN_ID) return "STARTER";
  if (razorpayPlanId === process.env.RAZORPAY_PRO_PLAN_ID) return "PRO";
  return "FREE";
}
