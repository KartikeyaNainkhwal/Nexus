import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  avatar: z.string().optional().nullable(),
});

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const { name, avatar } = profileSchema.parse(json);

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name, avatar },
    });

    // Create Activity Log
    if (session.user.organizationId) {
      await prisma.activityLog.create({
        data: {
          action: "profile_updated",
          entity: "User",
          entityId: user.id,
          organizationId: session.user.organizationId,
          userId: session.user.id,
          metadata: { name } as Prisma.JsonObject,
        },
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
}
