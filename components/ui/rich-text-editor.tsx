"use client";

// Dynamic import to prevent SSR issues with TipTap (it uses browser-only APIs)
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const RichTextEditorImpl = dynamic(
    () => import("./rich-text-editor-impl").then(mod => mod.RichTextEditorImpl),
    {
        ssr: false,
        loading: () => (
            <div className="w-full bg-white/5 border border-white/10 rounded-lg h-[140px] flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
            </div>
        ),
    }
);

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function RichTextEditor(props: RichTextEditorProps) {
    return <RichTextEditorImpl {...props} />;
}
