import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkAIRequestLimit, incrementAIRequests, PlanLimitError } from "@/lib/planLimits";

const SYSTEM_PROMPTS: Record<string, string> = {
    summarize:
        "You are a helpful assistant. Summarize the following document content in 3-5 bullet points. Be concise and clear. Format as markdown bullet points.",
    improve:
        "You are an expert editor. Improve the writing quality of the following text. Make it clearer, more professional, and more engaging. Return only the improved text, no explanation.",
    tasks:
        "You are a project manager. Extract all action items and tasks from the following document. Format as a numbered list. Each task should start with a verb. Return only the task list.",
    expand:
        "You are a writer. Expand the following text with more detail and context. Keep the same tone and style. Return only the expanded text.",
    shorten:
        "Make the following text more concise while keeping all key information. Return only the shortened text.",
    fix: "Fix all grammar and spelling errors in the following text. Return only the corrected text, no explanation.",
};

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

    let body: { action: string; content: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { action, content } = body;
    if (!action || !content) {
        return NextResponse.json({ error: "action and content are required" }, { status: 400 });
    }

    const systemPrompt = SYSTEM_PROMPTS[action];
    if (!systemPrompt) {
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    try {
        // Dynamic import to avoid build errors when anthropic package isn't configured
        const { streamText } = await import("ai");
        const { groq } = await import("@ai-sdk/groq");

        const result = streamText({
            model: groq("llama-3.3-70b-versatile"),
            system: systemPrompt,
            messages: [{ role: "user", content }],
        });

        // Increment usage count (fire-and-forget, don't block the stream)
        incrementAIRequests(session.user.id).catch(console.error);

        return result.toTextStreamResponse();
    } catch (err) {
        console.error("[AI_DOCUMENT_ERROR]", err);
        return NextResponse.json({ error: "AI request failed" }, { status: 500 });
    }
}
