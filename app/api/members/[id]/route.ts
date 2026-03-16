import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrgMemberRole } from "@prisma/client";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.nativeEnum(OrgMemberRole)
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserMember = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id, organizationId: session.user.organizationId }
    });

    if (!currentUserMember || (currentUserMember.role !== "OWNER" && currentUserMember.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Require OWNER or ADMIN role" }, { status: 403 });
    }

    const targetMember = await prisma.organizationMember.findUnique({
      where: { id: params.id },
      include: { user: true }
    });

    if (!targetMember || targetMember.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (targetMember.userId === session.user.id) {
      return NextResponse.json({ error: "Cannot modify your own role" }, { status: 400 });
    }

    if (targetMember.role === "OWNER") {
      return NextResponse.json({ error: "Cannot modify OWNER role" }, { status: 400 });
    }

    const json = await req.json();
    const { role } = updateRoleSchema.parse(json);

    if (role === "OWNER") {
      return NextResponse.json({ error: "Cannot manually promote to OWNER" }, { status: 400 });
    }

    const updated = await prisma.organizationMember.update({
      where: { id: params.id },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
    });

    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: "role_updated",
        entity: "Member",
        entityId: targetMember.userId,
        metadata: { newRole: role, affectedUser: targetMember.user.name }
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[MEMBER_PATCH]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as z.ZodError).issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
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

    const targetMember = await prisma.organizationMember.findUnique({
      where: { id: params.id },
      include: { user: true }
    });

    if (!targetMember || targetMember.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (targetMember.role === "OWNER") {
      return NextResponse.json({ error: "Cannot remove OWNER" }, { status: 400 });
    }

    if (targetMember.userId === session.user.id) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.organizationMember.delete({ where: { id: params.id } }),
      prisma.notification.deleteMany({
        where: { userId: targetMember.userId, organizationId: session.user.organizationId }
      }),
      prisma.activityLog.create({
        data: {
          organizationId: session.user.organizationId,
          userId: session.user.id,
          action: "member_removed",
          entity: "Member",
          entityId: targetMember.userId,
          metadata: { removedUser: targetMember.user.name }
        }
      })
    ]);

    return NextResponse.json({ message: "Member removed" });
  } catch (error) {
    console.error("[MEMBER_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
