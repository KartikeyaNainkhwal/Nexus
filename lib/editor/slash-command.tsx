import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import {
    Type, Heading1, Heading2, List, CheckSquare,
    Table, Image, Code, Quote
} from "lucide-react";
import React from "react";
import { SlashMenu } from "@/components/docs/SlashMenu";

export const SlashCommand = Extension.create({
    name: "slashCommand",

    addOptions() {
        return {
            suggestion: {
                char: "/",
                command: ({ editor, range, props }: any) => {
                    props.command({ editor, range });
                },
            },
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
            title: "Text",
            description: "Just start typing with plain text.",
            icon: <Type className="h-4 w-4" />,
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleNode("paragraph", "paragraph")
                    .run();
            },
        },
        {
            title: "Heading 1",
            description: "Big section heading.",
            icon: <Heading1 className="h-4 w-4" />,
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setNode("heading", { level: 1 })
                    .run();
            },
        },
        {
            title: "Heading 2",
            description: "Medium section heading.",
            icon: <Heading2 className="h-4 w-4" />,
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setNode("heading", { level: 2 })
                    .run();
            },
        },
        {
            title: "Todo List",
            description: "Track tasks with checkboxes.",
            icon: <CheckSquare className="h-4 w-4" />,
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleTaskList()
                    .run();
            },
        },
        {
            title: "Bullet List",
            description: "Create a simple bulleted list.",
            icon: <List className="h-4 w-4" />,
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleBulletList()
                    .run();
            },
        },
        {
            title: "Table",
            description: "Insert a 3x3 table.",
            icon: <Table className="h-4 w-4" />,
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                    .run();
            },
        },
        {
            title: "Code Block",
            description: "Capture a snippet of code.",
            icon: <Code className="h-4 w-4" />,
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleCodeBlock()
                    .run();
            },
        },
        {
            title: "Blockquote",
            description: "Capture a quote.",
            icon: <Quote className="h-4 w-4" />,
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleBlockquote()
                    .run();
            },
        },
    ].filter((item) =>
        item.title.toLowerCase().startsWith(query.toLowerCase())
    ).slice(0, 10);
};

export const renderItems = () => {
    let component: any;
    let popup: any;

    return {
        onStart: (props: any) => {
            component = new ReactRenderer(SlashMenu, {
                props,
                editor: props.editor,
            });

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
        onUpdate: (props: any) => {
            component.update(props);

            popup[0].setProps({
                getReferenceClientRect: props.clientRect,
            });
        },
        onKeyDown: (props: any) => {
            if (props.event.key === "Escape") {
                popup[0].hide();
                return true;
            }
            return component.ref?.onKeyDown(props);
        },
        onExit: () => {
            popup[0].destroy();
            component.destroy();
        },
    };
};
