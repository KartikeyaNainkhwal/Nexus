"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Document } from "@/types";
import {
    Plus, Pin, Trash2, MoreHorizontal, Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DocNavigatorProps {
    documents: Document[];
    projectId?: string;
    onNewDoc?: () => void;
    onDeleteDoc?: (id: string) => void;
    onPinDoc?: (id: string, pinned: boolean) => void;
}

interface GroupedDocs {
    [key: string]: { label: string; emoji: string; docs: Document[] };
}

export function DocNavigator({ documents, onNewDoc, onDeleteDoc, onPinDoc }: DocNavigatorProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [menuOpen, setMenuOpen] = useState<string | null>(null);

    const filtered = documents.filter((d) =>
        d.title.toLowerCase().includes(search.toLowerCase())
    );

    const pinned = filtered.filter((d) => d.isPinned);

    const grouped: GroupedDocs = {};
    filtered
        .filter((d) => !d.isPinned)
        .forEach((d) => {
            const key = d.projectId ?? "workspace";
            if (!grouped[key]) {
                grouped[key] = {
                    label: d.project?.name ?? "Workspace Docs",
                    emoji: d.project?.emoji ?? "🏠",
                    docs: [],
                };
            }
            grouped[key].docs.push(d);
        });

    const handleDelete = async (id: string) => {
        setMenuOpen(null);
        await fetch(`/api/documents/${id}`, { method: "DELETE" });
        onDeleteDoc?.(id);
        if (pathname === `/dashboard/docs/${id}`) router.push("/dashboard/docs");
    };

    const handlePin = async (id: string, pinned: boolean) => {
        setMenuOpen(null);
        await fetch(`/api/documents/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isPinned: !pinned }),
        });
        onPinDoc?.(id, !pinned);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Search */}
            <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search docs…"
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40"
                />
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 scrollbar-thin pr-0.5">
                {/* Pinned */}
                {pinned.length > 0 && (
                    <div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1 mb-1">
                            📌 Pinned
                        </p>
                        {pinned.map((doc) => (
                            <DocItem
                                key={doc.id}
                                doc={doc}
                                isActive={pathname === `/dashboard/docs/${doc.id}`}
                                menuOpen={menuOpen}
                                setMenuOpen={setMenuOpen}
                                onDelete={handleDelete}
                                onPin={handlePin}
                            />
                        ))}
                    </div>
                )}

                {/* Grouped */}
                {Object.entries(grouped).map(([key, group]) => (
                    <div key={key}>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1 mb-1">
                            {group.emoji} {group.label}
                        </p>
                        {group.docs.map((doc) => (
                            <DocItem
                                key={doc.id}
                                doc={doc}
                                isActive={pathname === `/dashboard/docs/${doc.id}`}
                                menuOpen={menuOpen}
                                setMenuOpen={setMenuOpen}
                                onDelete={handleDelete}
                                onPin={handlePin}
                            />
                        ))}
                    </div>
                ))}

                {filtered.length === 0 && (
                    <p className="text-xs text-text-muted text-center py-4">No documents found</p>
                )}
            </div>

            {/* New doc button */}
            <button
                onClick={onNewDoc}
                className="mt-3 flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-text-muted hover:text-white hover:bg-white/5 transition-colors"
            >
                <Plus className="w-3.5 h-3.5" />
                New document
            </button>
        </div>
    );
}

function DocItem({
    doc,
    isActive,
    menuOpen,
    setMenuOpen,
    onDelete,
    onPin,
}: {
    doc: Document;
    isActive: boolean;
    menuOpen: string | null;
    setMenuOpen: (id: string | null) => void;
    onDelete: (id: string) => void;
    onPin: (id: string, pinned: boolean) => void;
}) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(null);
            }
        };
        if (menuOpen === doc.id) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [menuOpen, doc.id, setMenuOpen]);

    return (
        <div className="relative group">
            <Link
                href={`/dashboard/docs/${doc.id}`}
                className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-[13px]",
                    isActive
                        ? "bg-accent/10 text-white"
                        : "text-text-muted hover:bg-white/5 hover:text-text-primary"
                )}
            >
                <span className="shrink-0">{doc.emoji}</span>
                <span className="truncate">{doc.title || "Untitled"}</span>
            </Link>
            <button
                onClick={(e) => { e.preventDefault(); setMenuOpen(menuOpen === doc.id ? null : doc.id); }}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded opacity-0 group-hover:opacity-100 text-text-muted hover:text-white hover:bg-white/10 transition-all"
            >
                <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            <AnimatePresence>
                {menuOpen === doc.id && (
                    <motion.div
                        ref={menuRef}
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-1 top-full mt-1 z-50 w-36 glass border border-border rounded-lg p-1 shadow-xl"
                    >
                        <button
                            onClick={() => onPin(doc.id, doc.isPinned)}
                            className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-text-secondary hover:text-white hover:bg-white/5 rounded-md transition-colors"
                        >
                            <Pin className="w-3.5 h-3.5" />
                            {doc.isPinned ? "Unpin" : "Pin"}
                        </button>
                        <button
                            onClick={() => onDelete(doc.id)}
                            className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
