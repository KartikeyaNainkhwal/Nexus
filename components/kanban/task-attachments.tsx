"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Paperclip, File } from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

interface Attachment {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    createdAt: string;
    user: { name: string; avatar: string | null };
}

export function TaskAttachments({ taskId }: { taskId: string }) {
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch(`/api/tasks/${taskId}/attachments`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setAttachments(data);
            })
            .finally(() => setLoading(false));
    }, [taskId]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limit to 5MB for demo
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`/api/tasks/${taskId}/attachments`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");
            const saved = await res.json();
            setAttachments((prev) => [saved, ...prev]);
            toast.success("File uploaded");
        } catch {
            toast.error("Failed to upload file");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    if (loading) return <div className="py-2 text-center"><Loader2 className="w-4 h-4 mx-auto animate-spin text-text-muted" /></div>;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Attachments ({attachments.length})
                </h3>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="h-6 text-[10px] px-2 text-text-muted hover:text-white"
                >
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Paperclip className="h-3 w-3 mr-1" />}
                    Add File
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUpload}
                    className="hidden"
                />
            </div>

            {attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {attachments.map(att => (
                        <a
                            key={att.id}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors group"
                        >
                            <div className="h-8 w-8 rounded bg-white/5 flex items-center justify-center shrink-0">
                                <File className="h-4 w-4 text-text-muted" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-text-primary truncate">{att.name}</p>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-text-muted">
                                    <span>{formatSize(att.size)}</span>
                                    <span>•</span>
                                    <span>{formatDistanceToNow(new Date(att.createdAt))}</span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            ) : (
                <div className="text-center py-4 bg-white/[0.01] border border-white/[0.05] border-dashed rounded-lg">
                    <p className="text-xs text-text-muted">No attachments yet</p>
                </div>
            )}
        </div>
    );
}
