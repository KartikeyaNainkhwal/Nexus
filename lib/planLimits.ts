import { prisma } from "./prisma";
import { SubscriptionPlan } from "@prisma/client";

export const PLAN_LIMITS = {
  FREE: { members: 2, projects: 3, aiRequests: 10 },
  STARTER: { members: 5, projects: 10, aiRequests: 50 },
  PRO: { members: 25, projects: 9999, aiRequests: 500 },
  ENTERPRISE: { members: 9999, projects: 9999, aiRequests: 999999 },
} as const;

export class PlanLimitError extends Error {
  public currentPlan: SubscriptionPlan;
  public limit: number;
  public upgradeUrl: string;

  constructor(message: string, currentPlan: SubscriptionPlan, limit: number) {
    super(message);
    this.name = "PlanLimitError";
    this.currentPlan = currentPlan;
    this.limit = limit;
    this.upgradeUrl = "/dashboard/billing";
  }
}

export async function checkMemberLimit(orgId: string): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { plan: true, _count: { select: { members: true } } },
  });

  if (!org) throw new Error("Organization not found");

  const limit = PLAN_LIMITS[org.plan].members;
  if (org._count.members >= limit) {
    throw new PlanLimitError(
      `Your organization has reached the maximum of ${limit} members on the ${org.plan} plan.`,
      org.plan,
      limit
    );
  }
}

export async function checkProjectLimit(orgId: string): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { plan: true, _count: { select: { projects: true } } },
  });

  if (!org) throw new Error("Organization not found");

  const limit = PLAN_LIMITS[org.plan].projects;
  if (org._count.projects >= limit) {
    throw new PlanLimitError(
      `Your organization has reached the limit of ${limit} projects on the ${org.plan} plan.`,
      org.plan,
      limit
    );
  }
}

// ── AI Request Limits ──────────────────────────────────────────

export async function checkAIRequestLimit(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiRequestsThisMonth: true, aiRequestsResetAt: true },
  });
  if (!user) throw new Error("User not found");

  // Monthly reset check
  const now = new Date();
  if (!user.aiRequestsResetAt || user.aiRequestsResetAt <= now) {
    // Will be reset on next increment — treat count as 0
    return;
  }

  // Find the org plan for this user
  const member = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: { select: { plan: true } } },
  });
  const plan = member?.organization?.plan ?? "FREE";
  const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS].aiRequests;

  if (user.aiRequestsThisMonth >= limit) {
    throw new PlanLimitError(
      `You have used all ${limit} AI requests for this month on the ${plan} plan.`,
      plan as SubscriptionPlan,
      limit
    );
  }
}

export async function incrementAIRequests(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiRequestsThisMonth: true, aiRequestsResetAt: true },
  });
  if (!user) return;

  const now = new Date();
  const needsReset = !user.aiRequestsResetAt || user.aiRequestsResetAt <= now;

  const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  await prisma.user.update({
    where: { id: userId },
    data: {
      aiRequestsThisMonth: needsReset ? 1 : { increment: 1 },
      aiRequestsResetAt: needsReset ? nextReset : undefined,
    },
  });
}
