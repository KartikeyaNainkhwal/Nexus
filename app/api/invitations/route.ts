import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInviteEmail } from "@/lib/mail";
import { z } from "zod";
import crypto from "crypto";
import { OrgMemberRole } from "@prisma/client";

const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(OrgMemberRole).default("MEMBER"),
});

export async function GET(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        organizationId: session.user.organizationId,
        status: "PENDING"
      },
      include: {
        invitedBy: {
          select: { name: true, avatar: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const enriched = invitations.map(inv => {
      const daysUntilExpiry = Math.ceil((inv.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return { ...inv, daysUntilExpiry };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("[INVITATIONS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserMember = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id, organizationId: session.user.organizationId }
    });

    if (!currentUserMember || (currentUserMember.role !== "OWNER" && currentUserMember.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Require OWNER or ADMIN role" }, { status: 403 });
    }

    const json = await req.json();
    const { email, role } = createInviteSchema.parse(json);

    const fullOrg = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      include: {
        _count: { select: { members: true, invitations: { where: { status: "PENDING" } } } }
      }
    });

    if (!fullOrg) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    // Ensure member isn't already inside
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId: existingUser.id, organizationId: session.user.organizationId } }
      });
      if (existingMember) {
        return NextResponse.json({ error: "User is already a member of this organization." }, { status: 400 });
      }
    }

    const existingPending = await prisma.invitation.findFirst({
      where: { organizationId: session.user.organizationId, email, status: "PENDING" }
    });

    const inviteUrlBase = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (existingPending) {
      // Resend email
      await sendInviteEmail({
        to: email,
        inviterName: session.user.name || "A team member",
        orgName: fullOrg.name,
        inviteUrl: `${inviteUrlBase}/invite/${existingPending.token}`,
        role: existingPending.role
      });
      return NextResponse.json(existingPending);
    }

    const totalCountConsideringInvites = fullOrg._count.members + fullOrg._count.invitations;
    const planLimits: Record<string, number> = { "FREE": 2, "STARTER": 5, "PRO": 25, "ENTERPRISE": 9999 };
    const limit = planLimits[fullOrg.plan] || 2;

    if (totalCountConsideringInvites >= limit) {
      return NextResponse.json({ error: `Invite limit reached. Max ${limit} members on ${fullOrg.plan} plan.` }, { status: 403 });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.invitation.create({
      data: {
        organizationId: session.user.organizationId,
        email,
        role,
        token,
        status: "PENDING",
        invitedById: session.user.id,
        expiresAt
      }
    });

    await sendInviteEmail({
      to: email,
      inviterName: session.user.name || "A team member",
      orgName: fullOrg.name,
      inviteUrl: `${inviteUrlBase}/invite/${token}`,
      role
    });

    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: "invitation_sent",
        entity: "Invitation",
        entityId: invitation.id,
        metadata: { invitedEmail: email, role }
      }
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    console.error("[INVITATIONS_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as z.ZodError).issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
