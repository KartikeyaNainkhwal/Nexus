import { Extension, Range } from "@tiptap/core";
import { Editor } from "@tiptap/react";
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion";

export const SlashCommand = Extension.create({
    name: "slashCommand",

    addOptions() {
        return {
            suggestion: {
                char: "/",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                command: ({ editor, range, props }: { editor: Editor; range: Range; props: { command: (item: any) => void } }) => {
                    props.command({ editor, range });
                },
            } as SuggestionOptions,
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});

export const getSuggestionItems = ({ query }: { query: string }) => {
    return [
        {
            title: "Heading 1",
            description: "Big section heading",
            command: ({ editor, range }: { editor: Editor; range: Range }) => {
                editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
            },
        },
        {
            title: "Heading 2",
            description: "Medium section heading",
            command: ({ editor, range }: { editor: Editor; range: Range }) => {
                editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
            },
        },
        {
            title: "Bullet List",
            description: "Create a simple bulleted list",
            command: ({ editor, range }: { editor: Editor; range: Range }) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run();
            },
        },
        {
            title: "Numbered List",
            description: "Create a list with numbering",
            command: ({ editor, range }: { editor: Editor; range: Range }) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run();
            },
        },
        {
            title: "Task List",
            description: "Track tasks with checkboxes",
            command: ({ editor, range }: { editor: Editor; range: Range }) => {
                editor.chain().focus().deleteRange(range).toggleTaskList().run();
            },
        },
        {
            title: "Blockquote",
            description: "Capture a quotation",
            command: ({ editor, range }: { editor: Editor; range: Range }) => {
                editor.chain().focus().deleteRange(range).toggleBlockquote().run();
            },
        },
        {
            title: "Code Block",
            description: "Capture a code snippet",
            command: ({ editor, range }: { editor: Editor; range: Range }) => {
                editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
            },
        },
    ].filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase()));
};
