"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Sparkles, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { Editor } from "@tiptap/react";

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface Project {
    id: string;
    name: string;
    emoji: string;
}

interface AISidePanelProps {
    editor: Editor | null;
    onClose: () => void;
    initialAction?: string;     // pre-fill extracted tasks, etc.
    initialTasks?: string;      // raw task text from extract action
    projects: Project[];
    userInitials: string;
}

function TypingDots() {
    return (
        <div className="flex items-center gap-1 py-1">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-accent"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
            ))}
        </div>
    );
}

function parseTaskLines(raw: string): string[] {
    return raw
        .split("\n")
        .map((l) => l.replace(/^\d+\.\s*/, "").replace(/^[-*]\s*/, "").trim())
        .filter((l) => l.length > 0);
}

export function AISidePanel({ editor, onClose, initialTasks, projects, userInitials }: AISidePanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Task extraction state
    const [extractedTasks, setExtractedTasks] = useState<string[]>(() =>
        initialTasks ? parseTaskLines(initialTasks) : []
    );
    const [checkedTasks, setCheckedTasks] = useState<Set<number>>(new Set());
    const [selectedProject, setSelectedProject] = useState(projects[0]?.id ?? "");
    const [addingTasks, setAddingTasks] = useState(false);
    const [taskSuccess, setTaskSuccess] = useState<string | null>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages, isStreaming, scrollToBottom]);

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 96) + "px";
    }, [input]);

    const getDocumentContext = useCallback(() => {
        if (!editor) return "";
        return editor.getText().slice(0, 4000);
    }, [editor]);

    const runQuickAction = async (action: "summarize" | "tasks" | "improve") => {
        if (!editor) return;
        const content = editor.getText();
        if (!content.trim()) {
            setError("The document is empty. Add some content first.");
            return;
        }

        setError(null);
        const userMsg: Message = {
            role: "user",
            content: action === "summarize" ? "Summarize this document" : action === "tasks" ? "Extract all tasks from this document" : "Improve this document",
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setIsStreaming(true);

        try {
            const res = await fetch("/api/ai/document", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, content }),
            });

            if (res.status === 503) {
                setError("AI features coming soon. Add your GROQ_API_KEY to enable.");
                setIsStreaming(false);
                return;
            }
            if (res.status === 429) {
                const data = await res.json();
                setError(data.message || "AI request limit exceeded.");
                setIsStreaming(false);
                return;
            }
            if (!res.ok) throw new Error("AI unavailable");

            const reader = res.body?.getReader();
            if (!reader) throw new Error("No body");

            let fullText = "";
            const decoder = new TextDecoder();
            const aiMsg: Message = { role: "assistant", content: "", timestamp: new Date() };
            setMessages((prev) => [...prev, aiMsg]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;
                setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { ...aiMsg, content: fullText };
                    return updated;
                });
            }

            if (!fullText.trim()) throw new Error("Empty AI response");

            if (action === "tasks") {
                setExtractedTasks(parseTaskLines(fullText));
                setCheckedTasks(new Set());
            }
        } catch (err) {
            console.error(err);
            setError("AI is temporarily unavailable. Please verify your API key or try again.");
            setMessages((prev) => prev.filter(m => m.content !== ""));
        } finally {
            setIsStreaming(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || isStreaming) return;
        const userText = input.trim();
        setInput("");
        setError(null);

        const userMsg: Message = { role: "user", content: userText, timestamp: new Date() };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setIsStreaming(true);

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: updatedMessages.map(({ role, content }) => ({ role, content })),
                    documentContext: getDocumentContext(),
                }),
            });

            if (res.status === 503) {
                setError("AI features coming soon. Add your GROQ_API_KEY to enable.");
                setIsStreaming(false);
                return;
            }
            if (res.status === 429) {
                const data = await res.json();
                setError(data.message || "AI limit exceeded. Upgrade your plan.");
                setIsStreaming(false);
                return;
            }
            if (!res.ok) throw new Error("AI unavailable");

            const reader = res.body?.getReader();
            if (!reader) throw new Error("No body");

            let fullText = "";
            const decoder = new TextDecoder();
            const aiMsg: Message = { role: "assistant", content: "", timestamp: new Date() };
            setMessages((prev) => [...prev, aiMsg]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;
                setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { ...aiMsg, content: fullText };
                    return updated;
                });
            }

            if (!fullText.trim()) throw new Error("Empty AI response");

        } catch (err) {
            console.error(err);
            setError("AI is temporarily unavailable. Please verify your API key or try again.");
            setMessages((prev) => prev.filter(m => m.content !== ""));
        } finally {
            setIsStreaming(false);
        }
    };

    const toggleTask = (idx: number) => {
        setCheckedTasks((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) {
                next.delete(idx);
            } else {
                next.add(idx);
            }
            return next;
        });
    };

    const addSelectedTasks = async () => {
        if (!selectedProject || checkedTasks.size === 0) return;
        setAddingTasks(true);
        setTaskSuccess(null);
        try {
            const tasksToAdd = extractedTasks.filter((_, i) => checkedTasks.has(i));
            await Promise.all(
                tasksToAdd.map((title) =>
                    fetch("/api/tasks", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ title, projectId: selectedProject }),
                    })
                )
            );
            setTaskSuccess(`${tasksToAdd.length} task${tasksToAdd.length > 1 ? "s" : ""} added to project ✓`);
            setCheckedTasks(new Set());
        } catch {
            setError("Failed to add tasks. Please try again.");
        } finally {
            setAddingTasks(false);
        }
    };

    const formatTime = (d: Date) =>
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return (
        <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-[60px] w-80 glass border-l border-white/[0.06] shadow-2xl flex flex-col z-40"
            style={{ height: "calc(100vh - 60px)" }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-text-primary">AI Assistant</span>
                </div>
                <button onClick={onClose} className="p-1 rounded-md text-text-muted hover:text-white hover:bg-white/5 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Quick actions */}
            <div className="px-3 py-2.5 border-b border-white/[0.06] flex gap-1.5 flex-wrap">
                {[
                    { label: "Summarize", action: "summarize" as const },
                    { label: "Extract Tasks", action: "tasks" as const },
                    { label: "Improve", action: "improve" as const },
                ].map(({ label, action }) => (
                    <button
                        key={action}
                        onClick={() => runQuickAction(action)}
                        disabled={isStreaming}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-white/5 border border-white/10 text-text-muted hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Error / rate limit */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mx-3 mt-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-[11px] text-red-400">{error}</p>
                            {error.includes("limit") && (
                                <a href="/dashboard/billing" className="text-[11px] text-accent hover:underline mt-1 block">
                                    Upgrade Plan →
                                </a>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Extracted tasks panel */}
            <AnimatePresence>
                {extractedTasks.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-b border-white/[0.06]"
                    >
                        <div className="p-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Extracted Tasks</p>
                                <button onClick={() => setExtractedTasks([])} className="text-[10px] text-text-muted hover:text-white">Clear</button>
                            </div>
                            <div className="space-y-1.5 max-h-32 overflow-y-auto mb-3">
                                {extractedTasks.map((task, i) => (
                                    <button
                                        key={i}
                                        onClick={() => toggleTask(i)}
                                        className={cn(
                                            "w-full flex items-start gap-2 text-left p-1.5 rounded-lg transition-colors",
                                            checkedTasks.has(i) ? "bg-accent/10" : "hover:bg-white/5"
                                        )}
                                    >
                                        {checkedTasks.has(i)
                                            ? <CheckSquare className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                                            : <Square className="w-3.5 h-3.5 text-text-muted mt-0.5 shrink-0" />}
                                        <span className="text-xs text-text-secondary leading-snug">{task}</span>
                                    </button>
                                ))}
                            </div>
                            {taskSuccess ? (
                                <p className="text-[11px] text-emerald-400">{taskSuccess}</p>
                            ) : (
                                <div className="flex gap-1.5 items-center">
                                    <select
                                        value={selectedProject}
                                        onChange={(e) => setSelectedProject(e.target.value)}
                                        className="flex-1 text-[11px] bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-text-secondary focus:outline-none"
                                    >
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={addSelectedTasks}
                                        disabled={addingTasks || checkedTasks.size === 0 || !selectedProject}
                                        className="px-2.5 py-1.5 text-[11px] font-semibold text-white rounded-lg disabled:opacity-40 transition-all"
                                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                                    >
                                        {addingTasks ? <Loader2 className="w-3 h-3 animate-spin" /> : `Add ${checkedTasks.size || ""}`}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 && (
                    <div className="text-center py-8">
                        <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-[13px] font-medium text-text-primary mb-1">AI Assistant</p>
                        <p className="text-[11px] text-text-muted">Ask anything about this document, extract tasks, or use the quick actions above.</p>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                        {/* Avatar */}
                        <div className={cn(
                            "w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold",
                            msg.role === "assistant"
                                ? "text-white"
                                : "bg-white/10 text-text-muted"
                        )}
                            style={msg.role === "assistant" ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)" } : {}}
                        >
                            {msg.role === "assistant" ? "✨" : userInitials}
                        </div>
                        {/* Bubble */}
                        <div className={cn(
                            "max-w-[80%]",
                            msg.role === "user" ? "items-end" : "items-start",
                            "flex flex-col gap-0.5"
                        )}>
                            <div className={cn(
                                "rounded-xl px-3 py-2 text-xs leading-relaxed",
                                msg.role === "user"
                                    ? "text-white rounded-tr-sm"
                                    : "glass border border-white/10 text-text-secondary rounded-tl-sm"
                            )}
                                style={msg.role === "user" ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)" } : {}}
                            >
                                <div className="whitespace-pre-wrap">{msg.content}
                                    {i === messages.length - 1 && msg.role === "assistant" && isStreaming && (
                                        <motion.span
                                            animate={{ opacity: [1, 0] }}
                                            transition={{ duration: 0.6, repeat: Infinity }}
                                            className="inline-block w-0.5 h-3 bg-accent ml-0.5 align-middle"
                                        />
                                    )}
                                </div>
                            </div>
                            <span className="text-[10px] text-text-muted px-1">{formatTime(msg.timestamp)}</span>
                        </div>
                    </div>
                ))}
                {isStreaming && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px]"
                            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>✨</div>
                        <div className="glass border border-white/10 rounded-xl px-3 py-2">
                            <TypingDots />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-white/[0.06] p-3">
                <div className="flex gap-2 items-end">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        placeholder="Ask anything about this document…"
                        rows={1}
                        disabled={isStreaming}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent/40 transition-colors disabled:opacity-50"
                        style={{ maxHeight: 96 }}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isStreaming}
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white disabled:opacity-40 transition-opacity"
                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                    >
                        {isStreaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                </div>
                <p className="text-[10px] text-text-muted mt-1.5 text-center">Uses context from current document</p>
            </div>
        </motion.div>
    );
}
