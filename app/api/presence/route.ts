import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher-server";
import { getInitials } from "@/lib/utils";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || !session.user.organizationId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { pageId, action } = await req.json();

        if (!pageId || !action) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        if (!pusherServer) {
            return new NextResponse("Pusher not configured", { status: 503 });
        }

        const channel = `presence-${session.user.organizationId}-${pageId}`;
        const event = action === "join" ? "user-joined" : "user-left";

        await pusherServer.trigger(channel, event, {
            userId: session.user.id,
            name: session.user.name,
            avatar: session.user.avatar,
            initials: getInitials(session.user.name || "User"),
            joinedAt: new Date().toISOString(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[PRESENCE_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
