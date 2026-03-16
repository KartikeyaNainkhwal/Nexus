"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DocNavigator } from "@/components/docs/DocNavigator";
import type { Document } from "@/types";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

interface DocsClientProps {
    initialDocuments: Document[];
}

export function DocsClient({ initialDocuments }: DocsClientProps) {
    const [documents, setDocuments] = useState<Document[]>(initialDocuments);
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
        // Handle quick action: New Document
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("new") === "true") {
            handleNewDoc();
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    if (!isMounted) return null;

    const handleNewDoc = async () => {
        const res = await fetch("/api/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });
        if (res.ok) {
            const doc = await res.json();
            setDocuments((prev) => [doc, ...prev]);
            router.push(`/dashboard/docs/${doc.id}`);
        }
    };

    const handleDeleteDoc = (id: string) => {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
    };

    const handlePinDoc = (id: string, pinned: boolean) => {
        setDocuments((prev) => prev.map((d) => d.id === id ? { ...d, isPinned: pinned } : d));
    };

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            {/* Left navigator */}
            <aside className="w-60 shrink-0 border-r border-white/[0.06] p-4 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-text-primary">Docs</h2>
                    <span className="text-[10px] bg-white/5 border border-white/10 rounded-md px-1.5 py-0.5 text-text-muted font-medium">
                        {documents.length}
                    </span>
                </div>
                <DocNavigator
                    documents={documents}
                    onNewDoc={handleNewDoc}
                    onDeleteDoc={handleDeleteDoc}
                    onPinDoc={handlePinDoc}
                />
            </aside>

            {/* Right empty state */}
            <main className="flex-1 flex flex-col items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-sm"
                >
                    <div className="text-6xl mb-6">📝</div>
                    <h3 className="text-xl font-bold text-text-primary mb-2">
                        Select a document to start reading
                    </h3>
                    <p className="text-sm text-text-muted mb-6">
                        Or create a new one to get started
                    </p>
                    <button
                        onClick={handleNewDoc}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent/80 text-white rounded-btn text-sm font-medium transition-colors shadow-glow"
                    >
                        <Plus className="w-4 h-4" />
                        New Document
                    </button>
                </motion.div>
            </main>
        </div>
    );
}
