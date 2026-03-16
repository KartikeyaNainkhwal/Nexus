"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type Editor } from "@tiptap/react";
import dynamic from "next/dynamic";
import { DocNavigator } from "@/components/docs/DocNavigator";
import { DocToolbar } from "@/components/docs/DocToolbar";
import { ShareModal } from "@/components/docs/ShareModal";
import type { Document } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Share2, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PresenceAvatars } from "@/components/shared/PresenceAvatars";

const DocEditor = dynamic(
    () => import("@/components/docs/DocEditor").then((m) => m.DocEditor),
    { ssr: false, loading: () => <div className="h-64 animate-pulse bg-white/5 rounded-xl mt-4" /> }
);

const AIFloatingToolbar = dynamic(
    () => import("@/components/docs/AIFloatingToolbar").then((m) => m.AIFloatingToolbar),
    { ssr: false }
);

const AISidePanel = dynamic(
    () => import("@/components/docs/AISidePanel").then((m) => m.AISidePanel),
    { ssr: false }
);

const EMOJIS = ["📄", "📝", "📋", "📌", "📎", "📓", "📒", "📔", "📕", "📗", "📘", "📙",
    "💡", "🌟", "🚀", "🎯", "✅", "🔥", "💎", "🏆", "🌈", "⚡", "🎨", "🔬",
    "🗺️", "🌐", "💾", "🖥️", "📊", "📈", "🎭", "🔑", "🌿", "🦋"];

interface DocEditorClientProps {
    document: Document & { createdBy: Record<string, unknown>; lastEditedBy?: Record<string, unknown>; project?: Record<string, unknown> };
    allDocuments: Document[];
    userInitials?: string;
}

interface Project {
    id: string;
    name: string;
    emoji: string;
}

export function DocEditorClient({ document: initialDoc, allDocuments: initialAllDocs, userInitials = "U" }: DocEditorClientProps) {
    const [document, setDocument] = useState(initialDoc);
    const [allDocuments, setAllDocuments] = useState(initialAllDocs);
    const [title, setTitle] = useState(initialDoc.title);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [editor, setEditor] = useState<Editor | null>(null);
    const titleTimer = useRef<NodeJS.Timeout | null>(null);
    const router = useRouter();

    // AI panel state
    const [showAIPanel, setShowAIPanel] = useState(false);
    const [aiPanelTasks, setAIPanelTasks] = useState<string | undefined>(undefined);
    const [projects, setProjects] = useState<Project[]>([]);

    const saveTitle = useCallback(async (value: string) => {
        if (titleTimer.current) clearTimeout(titleTimer.current);
        titleTimer.current = setTimeout(async () => {
            await fetch(`/api/documents/${document.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: value }),
            });
            setAllDocuments((prev) => prev.map((d) => d.id === document.id ? { ...d, title: value } : d));
        }, 500);
    }, [document.id]);

    const saveEmoji = useCallback(async (emoji: string) => {
        setDocument((d) => ({ ...d, emoji }));
        setAllDocuments((prev) => prev.map((d) => d.id === document.id ? { ...d, emoji } : d));
        setShowEmojiPicker(false);
        await fetch(`/api/documents/${document.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emoji }),
        });
    }, [document.id]);

    const handleNewDoc = async () => {
        const res = await fetch("/api/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });
        if (res.ok) {
            const doc = await res.json();
            setAllDocuments((prev) => [doc, ...prev]);
            router.push(`/dashboard/docs/${doc.id}`);
        }
    };

    const handleDeleteDoc = (id: string) => {
        setAllDocuments((prev) => prev.filter((d) => d.id !== id));
        if (id === document.id) router.push("/dashboard/docs");
    };

    const handlePinDoc = (id: string, pinned: boolean) => {
        setAllDocuments((prev) => prev.map((d) => d.id === id ? { ...d, isPinned: pinned } : d));
        if (id === document.id) setDocument((d) => ({ ...d, isPinned: pinned }));
    };

    const [lastEdited, setLastEdited] = useState("");

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Fetch projects for AI task extraction dropdown
    useEffect(() => {
        fetch("/api/projects")
            .then((r) => r.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setProjects(data.map((p: Project) => ({ id: p.id, name: p.name, emoji: p.emoji ?? "📁" })));
                }
            })
            .catch(console.error);
    }, []);

    // Run formatting on client-mount to avoid hydration mismatch
    useEffect(() => {
        if (document?.updatedAt) {
            setLastEdited(formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true }));
        }
    }, [document.updatedAt]);

    // Keyboard shortcut: CMD+I to open AI panel
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "i") {
                e.preventDefault();
                setShowAIPanel((v) => !v);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const handleExtractTasks = useCallback((tasks: string) => {
        setAIPanelTasks(tasks);
        setShowAIPanel(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="flex h-[calc(100vh-4rem)] animate-pulse bg-bg-hover" />
        );
    }

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            {/* Left navigator */}
            <aside className="w-60 shrink-0 border-r border-border p-4 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-text-primary">Docs</h2>
                    <span className="text-[10px] bg-bg-hover border border-border rounded-md px-1.5 py-0.5 text-text-muted font-medium">
                        {allDocuments.length}
                    </span>
                </div>
                <DocNavigator
                    documents={allDocuments}
                    onNewDoc={handleNewDoc}
                    onDeleteDoc={handleDeleteDoc}
                    onPinDoc={handlePinDoc}
                />
            </aside>

            {/* Editor area — shrinks when AI panel is open */}
            <main className="flex-1 overflow-y-auto transition-all duration-300">
                <div className="max-w-3xl mx-auto px-6 py-8">
                    {/* Emoji + actions row */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="relative">
                            <button
                                onClick={() => setShowEmojiPicker((v) => !v)}
                                className="text-5xl leading-none hover:scale-110 transition-transform cursor-pointer select-none"
                                title="Change emoji"
                            >
                                {document.emoji}
                            </button>
                            <AnimatePresence>
                                {showEmojiPicker && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 4 }}
                                        className="absolute top-full left-0 mt-2 z-50 glass border border-border rounded-2xl p-3 w-64 shadow-2xl"
                                    >
                                        <div className="grid grid-cols-7 gap-1">
                                            {EMOJIS.map((e) => (
                                                <button
                                                    key={e}
                                                    onClick={() => saveEmoji(e)}
                                                    className="text-xl p-1 rounded-lg hover:bg-white/10 transition-colors"
                                                >
                                                    {e}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <button
                            onClick={() => setShowShareModal(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-bg-hover hover:bg-bg-elevated border border-border rounded-lg text-sm text-text-secondary hover:text-white transition-colors"
                        >
                            <Share2 className="w-3.5 h-3.5" />
                            Share
                        </button>
                    </div>

                    {/* Title */}
                    <input
                        value={title}
                        onChange={(e) => { setTitle(e.target.value); saveTitle(e.target.value); }}
                        placeholder="Untitled"
                        className="w-full bg-transparent text-[40px] font-black tracking-[-0.04em] text-text-primary placeholder:text-text-subtle focus:outline-none mb-3"
                        style={{ letterSpacing: "-0.04em", lineHeight: 1.1 }}
                    />

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-[13px] text-text-muted mb-6 flex-wrap">
                        <span>{document.createdBy?.name ?? "Unknown"}</span>
                        <span>·</span>
                        <span>Last edited {lastEdited || "…"}</span>
                        {document.project && (
                            <>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-bg-hover rounded-full text-xs">
                                    {document.project.emoji} {document.project.name}
                                </span>
                            </>
                        )}
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                                <Users className="w-3 h-3" />
                                Editing with:
                            </span>
                            <PresenceAvatars pageId={`doc-${document.id}`} />
                        </div>
                    </div>

                    {/* Toolbar with AI button */}
                    <DocToolbar editor={editor} onOpenAI={() => setShowAIPanel(true)} />

                    {/* Editor */}
                    <DocEditor
                        documentId={document.id}
                        initialContent={document.content}
                        onEditorReady={setEditor}
                    />
                </div>
            </main>

            {/* AI Floating Toolbar (appears on text selection) */}
            {editor && (
                <AIFloatingToolbar
                    editor={editor}
                    onExtractTasks={handleExtractTasks}
                />
            )}

            {/* AI Side Panel */}
            <AnimatePresence>
                {showAIPanel && (
                    <AISidePanel
                        editor={editor}
                        onClose={() => { setShowAIPanel(false); setAIPanelTasks(undefined); }}
                        initialTasks={aiPanelTasks}
                        projects={projects}
                        userInitials={userInitials}
                    />
                )}
            </AnimatePresence>

            {/* Share modal */}
            {showShareModal && (
                <ShareModal
                    documentId={document.id}
                    projectId={document.projectId ?? null}
                    isPublic={document.isPublic}
                    onClose={() => setShowShareModal(false)}
                    onTogglePublic={(v) => setDocument((d) => ({ ...d, isPublic: v }))}
                />
            )}
        </div>
    );
}
