import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const notificationsSchema = z.object({
  taskAssigned: z.boolean(),
  taskCompleted: z.boolean(),
  memberJoined: z.boolean(),
  projectCreated: z.boolean(),
  paymentIssues: z.boolean(),
});

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const preferences = notificationsSchema.parse(json);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        notificationPreferences: preferences as any,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
}
