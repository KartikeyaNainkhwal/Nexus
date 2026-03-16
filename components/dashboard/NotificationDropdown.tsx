"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatRelativeTime, cn } from "@/lib/utils";
import {
    CheckSquare,
    CheckCircle,
    UserPlus,
    FolderPlus,
    AlertCircle,
    Bell,
    Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { LucideIcon } from "lucide-react";

interface Notification {
    id: string;
    type: string;
    message: string;
    read: boolean;
    link: string | null;
    createdAt: string;
}

const ICONS: Record<string, { icon: LucideIcon; color: string }> = {
    TASK_ASSIGNED: { icon: CheckSquare, color: "text-info" },
    TASK_COMPLETED: { icon: CheckCircle, color: "text-success" },
    MEMBER_JOINED: { icon: UserPlus, color: "text-accent" },
    PROJECT_CREATED: { icon: FolderPlus, color: "text-accent-pink" },
    PAYMENT_FAILED: { icon: AlertCircle, color: "text-danger" },
};

export function NotificationDropdown({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string, link: string | null) => {
        try {
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
            await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
            onClose();
            if (link) router.push(link);
        } catch (error) {
            console.error(error);
        }
    };

    const markAllRead = async () => {
        try {
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            await fetch(`/api/notifications/read-all`, { method: "PATCH" });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={onClose}
                        aria-hidden="true"
                    />
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-12 w-80 max-h-[400px] flex flex-col bg-bg-elevated border border-border shadow-elevated rounded-card overflow-hidden z-50 glass"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-black/20">
                            <h3 className="font-semibold text-text-primary text-sm">
                                Notifications
                            </h3>
                            {notifications.some((n) => !n.read) && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs text-accent hover:text-accent-light transition-colors flex items-center gap-1"
                                >
                                    <Check className="w-3 h-3" />
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
                            {loading ? (
                                <div className="py-8 text-center text-text-muted text-sm space-y-2">
                                    <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                                    <p>Loading...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="py-8 text-center text-text-muted space-y-3">
                                    <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center">
                                        <Bell className="w-6 h-6 text-text-muted/50" />
                                    </div>
                                    <p className="text-sm">You&apos;re all caught up!</p>
                                </div>
                            ) : (
                                notifications.map((notif, i) => {
                                    const IconConfig = ICONS[notif.type] || {
                                        icon: Bell,
                                        color: "text-text-muted",
                                    };
                                    const Icon = IconConfig.icon;

                                    return (
                                        <motion.button
                                            key={notif.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => markAsRead(notif.id, notif.link)}
                                            className={cn(
                                                "w-full text-left p-3 rounded-btn flex gap-3 transition-colors relative group",
                                                notif.read
                                                    ? "hover:bg-white/5"
                                                    : "bg-accent/5 hover:bg-accent/10"
                                            )}
                                        >
                                            <div className={cn("mt-0.5 shrink-0", IconConfig.color)}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className={cn(
                                                        "text-xs leading-relaxed",
                                                        notif.read ? "text-text-muted" : "text-text-primary"
                                                    )}
                                                >
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] text-text-subtle mt-1 font-mono">
                                                    {formatRelativeTime(notif.createdAt)}
                                                </p>
                                            </div>
                                            {!notif.read && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                            )}
                                        </motion.button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
