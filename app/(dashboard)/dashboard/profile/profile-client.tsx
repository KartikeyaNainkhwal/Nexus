"use client";

import { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { TaskStatus, TaskPriority } from "@prisma/client";
import toast from "react-hot-toast";
import NextImage from "next/image";
import { getInitials } from "@/lib/utils";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/shared/Badge";
import { CheckCircle2 } from "lucide-react";

interface Project {
    id: string;
    name: string;
    color: string;
}

interface UserData {
    id: string;
    name: string | null;
    avatar: string | null;
}

interface Task {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string | null;
    tags: string[];
    projectId: string;
    project: Project;
    assignedToId: string | null;
    assignedTo: UserData | null;
    createdAt: string;
}

interface ProfileClientProps {
    user: {
        id: string;
        name?: string | null;
        email?: string | null;
        avatar?: string | null;
        role?: string | null;
    };
    initialTasks: Task[];
}

const COLUMNS = [
    { id: "TODO", title: "To Do", color: "#64748b" },
    { id: "IN_PROGRESS", title: "In Progress", color: "#6366f1" },
    { id: "IN_REVIEW", title: "In Review", color: "#f59e0b" },
    { id: "DONE", title: "Completed", color: "#10b981" },
] as const;

export function ProfileClient({ user, initialTasks }: ProfileClientProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const newStatus = destination.droppableId as TaskStatus;

        // Optimistic update
        const previousTasks = [...tasks];

        setTasks(prev => prev.map(t =>
            t.id === draggableId ? { ...t, status: newStatus } : t
        ));

        // Background update
        try {
            const res = await fetch(`/api/tasks/${draggableId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error();
        } catch (error) {
            toast.error("Failed to update task status");
            setTasks(previousTasks); // Revert on failure
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                heading="My Profile"
                description="Manage your workload across all projects."
            />

            {/* Profile Info Card */}
            <div className="bg-surface border border-border-default rounded-2xl p-6 shadow-sm flex items-center gap-6">
                <div className="h-20 w-20 rounded-2xl bg-accent text-white flex items-center justify-center text-3xl font-black shadow-xl shadow-accent/20 overflow-hidden relative">
                    {user.avatar ? (
                        <NextImage src={user.avatar} fill alt={user.name || "User"} className="object-cover" />
                    ) : (
                        getInitials(user.name || "User")
                    )}
                </div>
                <div>
                    <h2 className="text-2xl font-black text-text-primary">{user.name}</h2>
                    <p className="text-sm font-bold text-text-muted mt-1">{user.email}</p>
                    <div className="mt-3 flex items-center gap-2">
                        <Badge variant="default">{user.role || "Member"}</Badge>
                        <Badge className="bg-bg-hover text-text-secondary border-border pl-1.5 gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                            {tasks.length} total tasks
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Kanban Board */}
            <div>
                <h3 className="text-lg font-black text-text-primary mb-6">My Tasks</h3>
                <div className="h-[calc(100vh-320px)] min-h-[500px]">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="flex h-full gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                            {COLUMNS.map((col) => (
                                <KanbanColumn
                                    key={col.id}
                                    id={col.id as TaskStatus}
                                    title={col.title}
                                    color={col.color}
                                    tasks={tasks.filter(t => t.status === col.id)}
                                    projectId=""
                                    canEdit={false}
                                    currentUserId={user.id}
                                    isAdmin={true}
                                    onTaskClick={(task) => {
                                        toast("To edit details, go to the Tasks page or Project Board.", { icon: "ℹ️" });
                                    }}
                                    onTaskMove={(taskId, direction) => {
                                        const currentStatusIndex = COLUMNS.findIndex(c => c.id === tasks.find(t => t.id === taskId)?.status);
                                        if (direction === "left" && currentStatusIndex > 0) {
                                            const previousStatus = COLUMNS[currentStatusIndex - 1].id;
                                            onDragEnd({ destination: { droppableId: previousStatus, index: 0 }, source: { droppableId: tasks.find(t => t.id === taskId)?.status!, index: 0 }, draggableId: taskId, type: "DEFAULT", mode: "FLUID", reason: "DROP", combine: null });
                                        } else if (direction === "right" && currentStatusIndex < COLUMNS.length - 1) {
                                            const nextStatus = COLUMNS[currentStatusIndex + 1].id;
                                            onDragEnd({ destination: { droppableId: nextStatus, index: 0 }, source: { droppableId: tasks.find(t => t.id === taskId)?.status!, index: 0 }, draggableId: taskId, type: "DEFAULT", mode: "FLUID", reason: "DROP", combine: null });
                                        }
                                    }}
                                    onTaskStatusChange={(taskId, status) => {
                                        onDragEnd({ destination: { droppableId: status, index: 0 }, source: { droppableId: tasks.find(t => t.id === taskId)?.status!, index: 0 }, draggableId: taskId, type: "DEFAULT", mode: "FLUID", reason: "DROP", combine: null });
                                    }}
                                    onTaskDelete={(taskId) => {
                                        toast.error("Delete task from the Project board.");
                                    }}
                                    onAddTask={() => { }}
                                />
                            ))}
                        </div>
                    </DragDropContext>
                </div>
            </div>
        </div>
    );
}
