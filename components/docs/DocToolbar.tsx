"use client";

import { Editor } from "@tiptap/react";
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    Heading1, Heading2, Heading3,
    List, ListOrdered, CheckSquare,
    Code, Quote, Link as LinkIcon,
    Highlighter, Table as TableIcon,
    Minus, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DocToolbarProps {
    editor: Editor | null;
    onOpenAI?: () => void;
}

interface ToolbarButton {
    label: string;
    icon: React.ElementType;
    isActive?: () => boolean;
    onClick: () => void;
}

export function DocToolbar({ editor, onOpenAI }: DocToolbarProps) {
    if (!editor) return null;

    const setLink = () => {
        const previousUrl = editor.getAttributes("link").href as string;
        const url = window.prompt("URL", previousUrl);
        if (url === null) return;
        if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    };

    const insertTable = () => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    };

    const groups: ToolbarButton[][] = [
        [
            { label: "Bold", icon: Bold, isActive: () => editor.isActive("bold"), onClick: () => editor.chain().focus().toggleBold().run() },
            { label: "Italic", icon: Italic, isActive: () => editor.isActive("italic"), onClick: () => editor.chain().focus().toggleItalic().run() },
            { label: "Underline", icon: UnderlineIcon, isActive: () => editor.isActive("underline"), onClick: () => editor.chain().focus().toggleUnderline?.().run() },
            { label: "Strikethrough", icon: Strikethrough, isActive: () => editor.isActive("strike"), onClick: () => editor.chain().focus().toggleStrike().run() },
        ],
        [
            { label: "H1", icon: Heading1, isActive: () => editor.isActive("heading", { level: 1 }), onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
            { label: "H2", icon: Heading2, isActive: () => editor.isActive("heading", { level: 2 }), onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
            { label: "H3", icon: Heading3, isActive: () => editor.isActive("heading", { level: 3 }), onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
        ],
        [
            { label: "Bullet List", icon: List, isActive: () => editor.isActive("bulletList"), onClick: () => editor.chain().focus().toggleBulletList().run() },
            { label: "Ordered List", icon: ListOrdered, isActive: () => editor.isActive("orderedList"), onClick: () => editor.chain().focus().toggleOrderedList().run() },
            { label: "Checklist", icon: CheckSquare, isActive: () => editor.isActive("taskList"), onClick: () => editor.chain().focus().toggleTaskList().run() },
        ],
        [
            { label: "Code Block", icon: Code, isActive: () => editor.isActive("codeBlock"), onClick: () => editor.chain().focus().toggleCodeBlock().run() },
            { label: "Blockquote", icon: Quote, isActive: () => editor.isActive("blockquote"), onClick: () => editor.chain().focus().toggleBlockquote().run() },
            { label: "Link", icon: LinkIcon, isActive: () => editor.isActive("link"), onClick: setLink },
            { label: "Highlight", icon: Highlighter, isActive: () => editor.isActive("highlight"), onClick: () => editor.chain().focus().toggleHighlight().run() },
        ],
        [
            { label: "Table", icon: TableIcon, onClick: insertTable },
            { label: "Divider", icon: Minus, onClick: () => editor.chain().focus().setHorizontalRule().run() },
        ],
    ];

    return (
        <div className="sticky top-0 z-20 flex flex-wrap items-center gap-px px-2 py-1.5 mb-4 glass border border-white/10 rounded-xl backdrop-blur-xl">
            {groups.map((group, gi) => (
                <div key={gi} className="flex items-center gap-px">
                    {gi > 0 && <div className="w-px h-5 bg-white/10 mx-1.5" />}
                    {group.map((btn) => (
                        <button
                            key={btn.label}
                            title={btn.label}
                            onClick={btn.onClick}
                            className={cn(
                                "p-1.5 rounded-md transition-colors text-text-muted hover:text-white hover:bg-white/5",
                                btn.isActive?.() && "bg-white/10 text-white"
                            )}
                        >
                            <btn.icon className="w-4 h-4" />
                        </button>
                    ))}
                </div>
            ))}

            {/* AI button */}
            <div className="w-px h-5 bg-white/10 mx-1.5" />
            <button
                onClick={onOpenAI}
                title="Ask AI"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold transition-colors hover:bg-white/5"
                style={{ background: "transparent" }}
            >
                <Sparkles className="w-3.5 h-3.5" style={{ color: "#a78bfa" }} />
                <span style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Ask AI
                </span>
            </button>
        </div>
    );
}
