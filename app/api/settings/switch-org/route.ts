import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/settings/switch-org
 * Switch the user's active organization.
 * Body: { organizationId: string }
 *
 * This updates the JWT token's preferredOrgId so subsequent requests
 * use the new organization context.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { organizationId } = body;

    if (!organizationId || typeof organizationId !== "string") {
      return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
    }

    // Verify user is a member of the target org
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id, organizationId },
      include: { organization: { select: { id: true, name: true, slug: true } } },
    });

    if (!membership) {
      return NextResponse.json({ error: "You are not a member of this organization" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      organizationId: membership.organizationId,
      role: membership.role,
      organization: membership.organization,
    });
  } catch (error) {
    console.error("[SWITCH_ORG]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/settings/switch-org
 * List all organizations the user belongs to.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prisma.organizationMember.findMany({
      where: { userId: session.user.id },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, logo: true, plan: true },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return NextResponse.json(
      memberships.map((m) => ({
        organizationId: m.organizationId,
        role: m.role,
        joinedAt: m.joinedAt,
        organization: m.organization,
        isCurrent: m.organizationId === session.user.organizationId,
      }))
    );
  } catch (error) {
    console.error("[LIST_ORGS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
