"use client";

import { useState } from "react";
import { Link as LinkIcon, Copy, Check, Globe, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ShareModalProps {
    documentId: string;
    projectId?: string | null;
    isPublic: boolean;
    onClose: () => void;
    onTogglePublic: (value: boolean) => void;
}

export function ShareModal({ documentId, projectId, isPublic, onClose, onTogglePublic }: ShareModalProps) {
    const [copied, setCopied] = useState(false);
    const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/docs/${documentId}`;

    const copyLink = async () => {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggle = async () => {
        const next = !isPublic;
        await fetch(`/api/documents/${documentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isPublic: next }),
        });
        onTogglePublic(next);
    };

    const targetAudience = projectId ? "Project" : "Workspace";
    const targetDescription = projectId ? "Anyone in this project can view" : "Anyone in the organization can view";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="relative z-10 glass border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
                <h2 className="text-lg font-bold text-text-primary mb-1">Share Document</h2>
                <p className="text-sm text-text-muted mb-5">Control who can access this document</p>

                {/* Toggle */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl mb-4">
                    <div className="flex items-center gap-3">
                        {isPublic ? (
                            <Globe className="w-4 h-4 text-accent" />
                        ) : (
                            <Lock className="w-4 h-4 text-text-muted" />
                        )}
                        <div>
                            <p className="text-sm font-medium text-text-primary">
                                {isPublic ? `Visible to ${targetAudience}` : "Private"}
                            </p>
                            <p className="text-xs text-text-muted">
                                {isPublic ? targetDescription : "Only you can view (Admins retain access)"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={toggle}
                        className={`relative w-10 h-5 rounded-full transition-colors ${isPublic ? "bg-accent" : "bg-white/10"}`}
                    >
                        <div
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPublic ? "translate-x-5" : ""}`}
                        />
                    </button>
                </div>

                {/* Copy link */}
                <AnimatePresence>
                    {isPublic && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex gap-2 mb-4"
                        >
                            <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                <LinkIcon className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                <p className="text-xs text-text-muted truncate">{shareUrl}</p>
                            </div>
                            <button
                                onClick={copyLink}
                                className="px-3 py-2 bg-accent rounded-lg text-white text-xs font-medium hover:bg-accent/80 transition-colors flex items-center gap-1.5"
                            >
                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={onClose}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-text-primary transition-colors"
                >
                    Done
                </button>
            </motion.div>
        </div>
    );
}
