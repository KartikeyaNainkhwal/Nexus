"use client";

import { useEditor, EditorContent, ReactRenderer, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Heading from "@tiptap/extension-heading";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CharacterCount from "@tiptap/extension-character-count";
import { SlashCommand, getSuggestionItems } from "@/components/ui/slash-command";
import { CommandList, CommandListRef } from "@/components/ui/command-list";
import tippy, { Instance, Props } from "tippy.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface DocEditorProps {
    documentId: string;
    initialContent: Record<string, unknown> | null;
    onEditorReady?: (editor: Editor) => void;
}

type SaveStatus = "saved" | "saving" | "error";

interface CommandListProps {
    items: Array<{
        title: string;
        description: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        command: (props: { editor: Editor; range: any }) => void;
    }>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    command: (item: any) => void;
}

export function DocEditor({ documentId, initialContent, onEditorReady }: DocEditorProps) {
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const saveTimer = useRef<NodeJS.Timeout | null>(null);
    const router = useRouter();

    const saveContent = useCallback(
        async (content: Record<string, unknown>) => {
            setSaveStatus("saving");
            try {
                const res = await fetch(`/api/documents/${documentId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content }),
                });
                if (!res.ok) throw new Error("Save failed");
                setSaveStatus("saved");
                router.refresh();
            } catch {
                setSaveStatus("error");
            }
        },
        [documentId, router]
    );

    const editor = useEditor({
        extensions: [
            StarterKit,
            Typography,
            Highlight.configure({ multicolor: true }),
            TaskList,
            TaskItem.configure({ nested: true }),
            Color,
            TextStyle,
            Heading.configure({ levels: [1, 2, 3] }),
            Image,
            Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-accent underline" } }),
            Table.configure({ resizable: true }),
            TableRow,
            TableCell,
            TableHeader,
            CharacterCount,
            Placeholder.configure({
                placeholder: "Press '/' for commands, or just start writing…",
                emptyEditorClass:
                    "before:content-[attr(data-placeholder)] before:absolute before:text-[#334155] before:pointer-events-none before:opacity-100",
            }),
            SlashCommand.configure({
                suggestion: {
                    items: getSuggestionItems,
                    render: () => {
                        let component: ReactRenderer<CommandListRef, CommandListProps>;
                        let popup: Instance<Props>[];
                        return {
                            onStart: (props: { editor: Editor; clientRect: () => DOMRect }) => {
                                component = new ReactRenderer(CommandList, {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    props: props as any,
                                    editor: props.editor,
                                });
                                if (!props.clientRect) return;
                                popup = tippy("body", {
                                    getReferenceClientRect: props.clientRect,
                                    appendTo: () => document.body,
                                    content: component.element,
                                    showOnCreate: true,
                                    interactive: true,
                                    trigger: "manual",
                                    placement: "bottom-start",
                                });
                            },
                            onUpdate(props: { clientRect: () => DOMRect }) {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                component.updateProps(props as any);
                                if (!props.clientRect) return;
                                popup[0].setProps({ getReferenceClientRect: props.clientRect });
                            },
                            onKeyDown(props: { event: KeyboardEvent }) {
                                if (props.event.key === "Escape") { popup[0].hide(); return true; }
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                return (component as any).ref?.onKeyDown(props) || false;
                            },
                            onExit() {
                                popup[0].destroy();
                                component.destroy();
                            },
                        };
                    },
                },
            }),
        ],
        content: initialContent ?? undefined,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: "doc-prose outline-none min-h-[60vh] focus:outline-none",
            },
        },
        onUpdate: ({ editor }) => {
            const json = editor.getJSON() as Record<string, unknown>;
            setWordCount(editor.storage.characterCount.words());
            setCharCount(editor.storage.characterCount.characters());

            if (saveTimer.current) clearTimeout(saveTimer.current);
            saveTimer.current = setTimeout(() => saveContent(json), 500);
        },
    });

    useEffect(() => {
        if (editor) {
            setWordCount(editor.storage.characterCount.words());
            setCharCount(editor.storage.characterCount.characters());
            onEditorReady?.(editor);
        }
    }, [editor, onEditorReady]);

    useEffect(() => {
        return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    }, []);

    return (
        <div className="relative">
            {/* Save status indicator */}
            <div className="absolute top-0 right-0 flex items-center gap-1.5">
                {saveStatus === "saving" && (
                    <span className="flex items-center gap-1 text-[11px] text-text-muted">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Saving…
                    </span>
                )}
                {saveStatus === "saved" && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-500/70">
                        <CheckCircle className="w-3 h-3" />
                        Saved
                    </span>
                )}
                {saveStatus === "error" && (
                    <button
                        onClick={() => editor && saveContent(editor.getJSON() as Record<string, unknown>)}
                        className="flex items-center gap-1 text-[11px] text-red-400 hover:underline"
                    >
                        <AlertCircle className="w-3 h-3" />
                        Save failed — retry
                    </button>
                )}
            </div>

            <EditorContent editor={editor} className="mt-6" />

            {/* Word / char count */}
            <div className="mt-4 text-[11px] text-[#334155] select-none">
                {wordCount} words · {charCount} characters
            </div>
        </div>
    );
}
