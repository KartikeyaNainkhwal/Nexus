import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkAIRequestLimit, incrementAIRequests, PlanLimitError } from "@/lib/planLimits";

const SYSTEM_PROMPT = `You are a helpful assistant for Nexus, a project management SaaS.
Help users with their documents, tasks, and project planning.
Be concise, friendly, and practical. When extracting tasks, format them as a numbered list starting with verbs.
When summarizing, use bullet points. Always respond in markdown format.`;

export async function POST(req: Request) {
    // Check if AI is configured
    if (!process.env.GROQ_API_KEY) {
        return NextResponse.json({ error: "AI_NOT_CONFIGURED" }, { status: 503 });
    }

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await checkAIRequestLimit(session.user.id);
    } catch (err) {
        if (err instanceof PlanLimitError) {
            return NextResponse.json(
                { error: "RATE_LIMIT_EXCEEDED", message: err.message, upgradeUrl: err.upgradeUrl },
                { status: 429 }
            );
        }
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }

    let body: { messages: Array<{ role: string; content: string }>; documentContext?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { messages, documentContext } = body;
    if (!messages || !Array.isArray(messages)) {
        return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    const systemWithContext = documentContext
        ? `${SYSTEM_PROMPT}\n\nThe user is currently working on a document with the following content:\n\n${documentContext.slice(0, 4000)}`
        : SYSTEM_PROMPT;

    try {
        const { streamText } = await import("ai");
        const { groq } = await import("@ai-sdk/groq");

        const result = streamText({
            model: groq("llama-3.3-70b-versatile"),
            system: systemWithContext,
            messages: messages as Array<{ role: "user" | "assistant"; content: string }>,
        });

        // Increment usage count (fire-and-forget)
        incrementAIRequests(session.user.id).catch(console.error);

        return result.toTextStreamResponse();
    } catch (err) {
        console.error("[AI_CHAT_ERROR]", err);
        return NextResponse.json({ error: "AI request failed" }, { status: 500 });
    }
}
