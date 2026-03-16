"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: {
        name: string;
        avatar: string | null;
    };
}

export function TaskComments({ taskId }: { taskId: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        fetch(`/api/tasks/${taskId}/comments`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setComments(data);
            })
            .finally(() => setLoading(false));
    }, [taskId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setPosting(true);
        try {
            const res = await fetch(`/api/tasks/${taskId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newComment.trim() }),
            });
            if (!res.ok) throw new Error("Failed to post comment");
            const saved = await res.json();
            setComments((prev) => [...prev, saved]);
            setNewComment("");
        } catch {
            toast.error("Failed to post comment");
        } finally {
            setPosting(false);
        }
    };

    if (loading) return <div className="py-4 text-center"><Loader2 className="w-5 h-5 mx-auto animate-spin text-text-muted" /></div>;

    return (
        <div className="space-y-4">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Comments
            </h3>

            <div className="space-y-4">
                {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 text-sm">
                        <Avatar className="h-6 w-6 mt-0.5">
                            <AvatarImage src={comment.user.avatar ?? undefined} />
                            <AvatarFallback className="text-[10px] bg-accent/20 text-accent-light">
                                {comment.user.name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-white">{comment.user.name}</span>
                                <span className="text-xs text-text-muted">
                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                </span>
                            </div>
                            <p className="text-text-primary text-xs leading-relaxed">{comment.content}</p>
                        </div>
                    </div>
                ))}

                <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
                    <input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-md px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted/50 outline-none focus:border-accent/30 transition-colors"
                    />
                    <Button type="submit" size="sm" disabled={!newComment.trim() || posting} className="h-7 text-xs px-3">
                        {posting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Post"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
