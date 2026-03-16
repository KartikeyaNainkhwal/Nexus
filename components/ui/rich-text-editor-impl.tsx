"use client";

import { useEditor, EditorContent, ReactRenderer, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Bold, Italic, List, ListOrdered, Quote, Code, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { SlashCommand, getSuggestionItems } from "./slash-command";
import { CommandList, CommandListRef, CommandListProps } from "./command-list";
import tippy, { Instance, Props } from "tippy.js";

interface RichTextEditorImplProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

function EditorButton({
    isActive,
    onClick,
    children,
}: {
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "h-7 w-7 p-0 flex items-center justify-center rounded transition-colors text-text-muted hover:text-white hover:bg-white/5",
                isActive && "bg-white/10 text-white"
            )}
        >
            {children}
        </button>
    );
}

export function RichTextEditorImpl({ value, onChange, placeholder }: RichTextEditorImplProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Placeholder.configure({
                placeholder: placeholder || "Type '/' for commands...",
                emptyEditorClass:
                    "cursor-text before:content-[attr(data-placeholder)] before:absolute before:text-text-muted/50 before:opacity-100 before:pointer-events-none before:left-3",
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

                                if (!props.clientRect) {
                                    return;
                                }

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

                                if (!props.clientRect) {
                                    return;
                                }

                                popup[0].setProps({
                                    getReferenceClientRect: props.clientRect,
                                });
                            },

                            onKeyDown(props: { event: KeyboardEvent }) {
                                if (props.event.key === "Escape") {
                                    popup[0].hide();
                                    return true;
                                }

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
        content: value,
        editorProps: {
            attributes: {
                class:
                    "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[120px] px-3 py-2 text-sm text-white",
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    if (!editor) return null;

    return (
        <div className="w-full bg-white/5 border border-white/10 rounded-lg overflow-hidden focus-within:border-accent/40 transition-colors">
            <div className="flex flex-wrap items-center gap-1 p-1 border-b border-white/10 bg-white/[0.02]">
                <EditorButton
                    isActive={editor.isActive("bold")}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold className="h-4 w-4" />
                </EditorButton>
                <EditorButton
                    isActive={editor.isActive("italic")}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic className="h-4 w-4" />
                </EditorButton>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <EditorButton
                    isActive={editor.isActive("bulletList")}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <List className="h-4 w-4" />
                </EditorButton>
                <EditorButton
                    isActive={editor.isActive("orderedList")}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <ListOrdered className="h-4 w-4" />
                </EditorButton>
                <EditorButton
                    isActive={editor.isActive("taskList")}
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                >
                    <CheckSquare className="h-4 w-4" />
                </EditorButton>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <EditorButton
                    isActive={editor.isActive("blockquote")}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                >
                    <Quote className="h-4 w-4" />
                </EditorButton>
                <EditorButton
                    isActive={editor.isActive("codeBlock")}
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                >
                    <Code className="h-4 w-4" />
                </EditorButton>
            </div>
            <div className="relative">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
