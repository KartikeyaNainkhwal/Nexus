import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher-server";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { socket_id, channel_name } = await req.json();

        if (!pusherServer) {
            return new NextResponse("Pusher not configured", { status: 503 });
        }

        const authResponse = pusherServer.authorizeChannel(socket_id, channel_name, {
            user_id: session.user.id,
            user_info: {
                name: session.user.name,
                avatar: session.user.avatar,
            },
        });

        return NextResponse.json(authResponse);
    } catch (error) {
        console.error("[PUSHER_AUTH_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
