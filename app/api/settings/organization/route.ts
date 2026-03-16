import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const deleteSchema = z.object({
  confirmName: z.string(),
});

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.organizationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const { confirmName } = deleteSchema.parse(json);

    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
    });

    if (!org) {
      return new NextResponse("Organization not found", { status: 404 });
    }

    if (confirmName !== org.name) {
      return new NextResponse("Confirmation name does not match", { status: 400 });
    }

    // Check if user is the OWNER
    const member = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: session.user.organizationId,
      },
    });

    if (!member || member.role !== "OWNER") {
      return new NextResponse("Forbidden: Only owners can delete the organization", { status: 403 });
    }

    // Delete the organization
    // Cascading deletes in schema will handle the rest:
    // members, projects, tasks, invitations, notifications, activityLogs, subscription
    await prisma.organization.delete({
      where: { id: session.user.organizationId },
    });

    // Note: Ideally we would also cancel the Stripe subscription here if it exists
    // but the DB cascade covers the DB records.

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("[ORGANIZATION_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
