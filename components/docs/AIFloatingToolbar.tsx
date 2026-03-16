"use client";

import { Editor } from "@tiptap/react";
import { posToDOMRect } from "@tiptap/core";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectionCoords {
    top: number;
    left: number;
    width: number;
}

interface AIFloatingToolbarProps {
    editor: Editor | null;
    onExtractTasks: (tasks: string) => void;
}

type AIAction = "improve" | "shorten" | "expand" | "fix" | "tasks" | "summarize";

interface AIResult {
    originalText: string;
    resultText: string;
    action: AIAction;
    from: number;
    to: number;
}

const ACTIONS: { id: AIAction; label: string; emoji: string }[] = [
    { id: "improve", label: "Improve writing", emoji: "✨" },
    { id: "shorten", label: "Make shorter", emoji: "📝" },
    { id: "expand", label: "Expand", emoji: "📖" },
    { id: "fix", label: "Fix grammar", emoji: "🔧" },
    { id: "tasks", label: "Extract tasks", emoji: "📋" },
    { id: "summarize", label: "Summarize", emoji: "✂️" },
];

export function AIFloatingToolbar({ editor, onExtractTasks }: AIFloatingToolbarProps) {
    const [coords, setCoords] = useState<SelectionCoords | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [loading, setLoading] = useState(false);
    const [aiResult, setAiResult] = useState<AIResult | null>(null);

    const [error, setError] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const getSelectionCoords = useCallback((): SelectionCoords | null => {
        if (!editor) return null;
        const { from, to } = editor.state.selection;
        if (from === to) return null;
        try {
            const rect = posToDOMRect(editor.view, from, to);
            // rect.top is relative to the viewport.
            return {
                top: Math.max(0, rect.top - 48),
                left: rect.left + rect.width / 2,
                width: rect.width,
            };
        } catch {
            return null;
        }
    }, [editor]);

    useEffect(() => {
        if (!editor) return;

        const handleSelectionUpdate = () => {
            const { from, to } = editor.state.selection;
            if (from === to) {
                setCoords(null);
                setShowMenu(false);
                setAiResult(null);
                setError(null);
                return;
            }
            const newCoords = getSelectionCoords();
            setCoords(newCoords);
            if (!newCoords) setShowMenu(false);
        };

        editor.on("selectionUpdate", handleSelectionUpdate);
        return () => { editor.off("selectionUpdate", handleSelectionUpdate); };
    }, [editor, getSelectionCoords]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const runAction = async (action: AIAction) => {
        if (!editor) return;
        setShowMenu(false);
        setError(null);

        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, " ");
        if (!selectedText.trim()) return;

        setLoading(true);


        try {
            const res = await fetch("/api/ai/document", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, content: selectedText }),
            });

            if (res.status === 503) {
                setError("AI features coming soon. Configure GROQ_API_KEY to enable.");
                setLoading(false);
                return;
            }
            if (res.status === 429) {
                const data = await res.json();
                setError(data.message || "AI request limit exceeded. Upgrade your plan.");
                setLoading(false);
                return;
            }
            if (!res.ok) {
                setError("AI is temporarily unavailable. Please try again.");
                setLoading(false);
                return;
            }

            // Stream the response
            const reader = res.body?.getReader();
            if (!reader) throw new Error("No response body");

            let fullText = "";
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;

            }

            if (action === "tasks") {
                onExtractTasks(fullText);
                setLoading(false);
                return;
            }

            if (action === "summarize") {
                // Insert blockquote below the selection
                editor.chain().focus().setTextSelection(to).insertContent({
                    type: "blockquote",
                    content: [{ type: "paragraph", content: [{ type: "text", text: fullText.trim() }] }],
                }).run();
                setLoading(false);
                return;
            }

            // For text-replacement actions: show diff panel
            setAiResult({ originalText: selectedText, resultText: fullText, action, from, to });
            setLoading(false);
        } catch (err) {
            console.error("[AI_FLOATING_TOOLBAR]", err);
            setError("AI is temporarily unavailable. Please try again.");
            setLoading(false);
        }
    };

    const handleReplace = () => {
        if (!editor || !aiResult) return;
        editor.chain().focus().setTextSelection({ from: aiResult.from, to: aiResult.to })
            .insertContent(aiResult.resultText).run();
        setAiResult(null);
        setCoords(null);
    };

    const handleDiscard = () => {
        setAiResult(null);
        setError(null);

    };

    if (!coords) return null;

    return (
        <>
            {/* Floating "✨ AI" button */}
            <AnimatePresence>
                {!showMenu && !loading && !aiResult && !error && (
                    <motion.div
                        key="ai-btn"
                        initial={{ opacity: 0, y: 8, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: "fixed",
                            top: coords.top,
                            left: coords.left,
                            transform: "translateX(-50%) translateY(-100%)",
                            zIndex: 9999,
                        }}
                    >
                        <button
                            onMouseDown={(e) => { e.preventDefault(); setShowMenu(true); }}
                            style={{
                                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                color: "white",
                                padding: "6px 14px",
                                borderRadius: "999px",
                                fontSize: "13px",
                                fontWeight: 600,
                                boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
                                cursor: "pointer",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                            }}
                        >
                            ✨ AI
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading indicator */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0, y: 8, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "fixed",
                            top: coords.top,
                            left: coords.left,
                            transform: "translateX(-50%) translateY(-100%)",
                            zIndex: 9999,
                        }}
                    >
                        <div style={{
                            background: "rgba(15,15,25,0.9)",
                            border: "1px solid rgba(99,102,241,0.3)",
                            borderRadius: "999px",
                            padding: "6px 14px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "13px",
                            color: "#a5b4fc",
                            backdropFilter: "blur(12px)",
                        }}>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            AI is thinking…
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "fixed",
                            top: coords.top,
                            left: coords.left,
                            transform: "translateX(-50%) translateY(-100%)",
                            zIndex: 9999,
                            width: 300,
                        }}
                        className="glass border border-red-500/20 rounded-xl p-3 shadow-2xl"
                    >
                        <p className="text-xs text-red-400 mb-2">{error}</p>
                        <div className="flex gap-2">
                            {error.includes("limit") && (
                                <a href="/dashboard/billing" className="text-xs text-accent hover:underline">Upgrade Plan</a>
                            )}
                            <button onClick={handleDiscard} className="text-xs text-text-muted hover:text-white ml-auto">Dismiss</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Action menu */}
            <AnimatePresence>
                {showMenu && (
                    <motion.div
                        ref={menuRef}
                        key="menu"
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: "fixed",
                            top: coords.top,
                            left: coords.left,
                            transform: "translateX(-50%) translateY(-100%)",
                            zIndex: 9999,
                            width: 200,
                        }}
                        className="glass border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                    >
                        {ACTIONS.map((action) => (
                            <button
                                key={action.id}
                                onMouseDown={(e) => { e.preventDefault(); runAction(action.id); }}
                                className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2 text-[13px] text-text-secondary",
                                    "hover:bg-white/5 hover:text-white transition-colors text-left"
                                )}
                            >
                                <span>{action.emoji}</span>
                                {action.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Replace / Discard panel */}
            <AnimatePresence>
                {aiResult && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "fixed",
                            top: coords.top,
                            left: coords.left,
                            transform: "translateX(-50%) translateY(-100%)",
                            zIndex: 9999,
                            width: 360,
                        }}
                        className="glass border border-white/10 rounded-xl p-4 shadow-2xl"
                    >
                        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">AI Result</p>
                        <div className="mb-3 space-y-2 max-h-40 overflow-y-auto">
                            <p className="text-xs text-text-muted line-through">{aiResult.originalText.slice(0, 120)}{aiResult.originalText.length > 120 ? "…" : ""}</p>
                            <p className="text-xs text-emerald-400">{aiResult.resultText.slice(0, 200)}{aiResult.resultText.length > 200 ? "…" : ""}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleReplace}
                                className="flex-1 py-1.5 text-xs font-semibold rounded-lg text-white"
                                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                            >
                                Replace
                            </button>
                            <button
                                onClick={handleDiscard}
                                className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-white/5 text-text-muted hover:text-white hover:bg-white/10 transition-colors"
                            >
                                Discard
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
