import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        organizationId: session.user.organizationId,
        read: false
      },
      data: { read: true }
    });

    return NextResponse.json({ message: "All notifications marked as read." });
  } catch (error) {
    console.error("[NOTIFICATION_READ_ALL]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
