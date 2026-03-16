import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch members with user data and project count
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            _count: {
              select: { projectMemberships: true }
            }
          }
        }
      },
      orderBy: { joinedAt: "asc" }
    });

    const pendingInvitations = await prisma.invitation.findMany({
      where: {
        organizationId: session.user.organizationId,
        status: "PENDING",
      },
      include: {
        invitedBy: { select: { name: true, avatar: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ members, pendingInvitations });
  } catch (error) {
    console.error("[MEMBERS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
