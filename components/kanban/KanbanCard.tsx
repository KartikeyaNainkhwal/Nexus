"use client";

import { useState, useEffect, useRef } from "react";
import NextImage from "next/image";
import { Clock, GripVertical, Check } from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, isPast } from "date-fns";
import { Card } from "@/components/shared/Card";

interface Task {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string | null;
    assignedToId: string | null;
    assignedTo: { id: string; name: string | null; avatar: string | null } | null;
    tags: string[];
}

interface Props {
    task: Task;
    index: number;
    onClick: () => void;
    onMove: (taskId: string, direction: "left" | "right") => void;
    onStatusChange: (taskId: string, status: TaskStatus) => void;
    onDelete: (taskId: string) => void;
    isDragDisabled?: boolean;
}

export function KanbanCard({ task, index, onClick, onMove, onStatusChange, onDelete, isDragDisabled = false }: Props) {
    const [isCelebrated, setIsCelebrated] = useState(false);
    const prevStatus = useRef(task.status);

    useEffect(() => {
        if (task.status === "DONE" && prevStatus.current !== "DONE") {
            setIsCelebrated(true);
            setTimeout(() => setIsCelebrated(false), 2000);
        }
        prevStatus.current = task.status;
    }, [task.status]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (isDragDisabled) {
            // Only allow opening the task for viewing when drag is disabled
            if (e.key === "e" || e.key === "E") onClick();
            return;
        }
        switch (e.key) {
            case "ArrowRight":
                onMove(task.id, "right");
                break;
            case "ArrowLeft":
                onMove(task.id, "left");
                break;
            case "e":
            case "E":
                onClick();
                break;
            case "d":
            case "D":
                onStatusChange(task.id, "DONE");
                break;
            case "Delete":
            case "Backspace":
                onDelete(task.id);
                break;
        }
    };

    return (
        <Draggable draggableId={task.id} index={index} isDragDisabled={isDragDisabled}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="outline-none"
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                >
                    <motion.div
                        layout
                        layoutId={task.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            transition: { delay: index * 0.05 }
                        }}
                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Card
                            className={cn(
                                "group relative p-4 border-border-default hover:border-accent/40 shadow-sm transition-all duration-300 overflow-hidden",
                                snapshot.isDragging && "z-[9999] opacity-95 rotate-2 scale-[1.04] border-accent border-[1.5px] cursor-grabbing shadow-[0_20px_60px_rgba(0,0,0,0.2),0_8px_20px_rgba(99,102,241,0.2)]",
                                isCelebrated && "animate-success-pulse"
                            )}
                        >
                            {/* Shimmer Effect while dragging */}
                            {snapshot.isDragging && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer pointer-events-none" />
                            )}

                            {/* Drag Handle - hidden when drag is disabled */}
                            {!isDragDisabled && (
                                <div
                                    {...provided.dragHandleProps}
                                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-text-muted hover:text-text-primary"
                                >
                                    <GripVertical className="h-4 w-4" />
                                </div>
                            )}
                            {isDragDisabled && (
                                <div {...provided.dragHandleProps} className="hidden" />
                            )}

                            {/* Priority Indicator Bar */}
                            <motion.div
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                className={cn(
                                    "absolute left-0 top-0 bottom-0 w-1 origin-top",
                                    task.priority === "HIGH" ? "bg-danger" :
                                        task.priority === "MEDIUM" ? "bg-amber-400" : "bg-emerald-400"
                                )}
                            />

                            <div className="flex items-start justify-between gap-3 mb-3 pl-2">
                                <h4 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors leading-snug">
                                    {task.title}
                                </h4>
                            </div>

                            {task.description && (
                                <p className="text-xs text-text-muted line-clamp-2 mb-4 leading-relaxed pl-2">
                                    {task.description}
                                </p>
                            )}

                            <div className="flex items-center justify-between pl-2">
                                <div className="flex items-center gap-3">
                                    {task.dueDate && (
                                        <div className={cn(
                                            "flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight",
                                            isPast(new Date(task.dueDate)) && task.status !== "DONE" ? "text-danger" : "text-text-muted"
                                        )}>
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(task.dueDate), "MMM d")}
                                        </div>
                                    )}
                                </div>

                                {task.assignedTo && (
                                    <div className="h-6 w-6 rounded-full border border-border-default overflow-hidden bg-bg-hover flex items-center justify-center shrink-0 relative shadow-sm">
                                        {task.assignedTo.avatar ? (
                                            <NextImage
                                                src={task.assignedTo.avatar}
                                                alt={task.assignedTo.name || "Assignee"}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <span className="text-[10px] font-extrabold text-text-muted">
                                                {task.assignedTo.name?.[0].toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Celebration Particles */}
                            <AnimatePresence>
                                {isCelebrated && (
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                        {[...Array(6)].map((_, i) => (
                                            <motion.span
                                                key={i}
                                                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                                                animate={{
                                                    x: (Math.random() - 0.5) * 120,
                                                    y: (Math.random() - 1) * 60,
                                                    opacity: [0, 1, 0],
                                                    scale: [0, 1.2, 0]
                                                }}
                                                transition={{ duration: 0.6, ease: "easeOut" }}
                                                className="absolute text-emerald-500 font-bold"
                                            >
                                                <Check className="h-4 w-4" />
                                            </motion.span>
                                        ))}
                                    </div>
                                )}
                            </AnimatePresence>
                        </Card>
                    </motion.div>
                </div>
            )}
        </Draggable>
    );
}
