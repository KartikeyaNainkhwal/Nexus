"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Users } from "lucide-react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { Button } from "@/components/shared/Button";
import { AvatarStack } from "@/components/shared/AvatarStack";
import { Badge } from "@/components/shared/Badge";
import { TaskModal } from "@/components/dashboard/task-modal";
import { isPast } from "date-fns";
import toast from "react-hot-toast";
import { pusherClient } from "@/lib/pusher-client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";

const COLUMNS = [
    { id: "TODO", title: "To Do", color: "#64748b" },
    { id: "IN_PROGRESS", title: "In Progress", color: "#6366f1" },
    { id: "IN_REVIEW", title: "In Review", color: "#f59e0b" },
    { id: "DONE", title: "Completed", color: "#10b981" },
] as const;

interface Task {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: any;
    dueDate: string | null;
    assignedToId: string | null;
    assignedTo: { id: string; name: string | null; avatar: string | null } | null;
    tags: string[];
}

export interface KanbanProject {
    id: string;
    name: string;
    description: string | null;
    emoji: string;
    color: string;
    tasks: Task[];
    members: any[];
    createdAt: string;
    updatedAt: string;
}

export function KanbanBoard({ project }: { project: KanbanProject }) {
    const [tasks, setTasks] = useState<Task[]>(project.tasks);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editTaskData, setEditTaskData] = useState<Task | undefined>(undefined);
    const [defaultNewTaskStatus, setDefaultNewTaskStatus] = useState<TaskStatus>("TODO");
    const { data: session } = useSession();
    const currentUserId = session?.user?.id;
    const orgId = session?.user?.organizationId;

    const isOrgAdmin = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";
    const currentMember = project.members.find(m => m.id === currentUserId);
    const isProjectAdmin = currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";
    const canEdit = isOrgAdmin || isProjectAdmin;

    // Members only see their own assigned tasks; Admins/Owners see all
    const visibleTasks = useMemo(() => {
        if (canEdit) return tasks;
        return tasks.filter(t => t.assignedToId === currentUserId);
    }, [tasks, canEdit, currentUserId]);

    useEffect(() => {
        if (!orgId || !pusherClient) return;
        const channel = pusherClient.subscribe(`org-${orgId}`);
        channel.bind("task-moved", (data: any) => {
            if (data.userId !== currentUserId) {
                setTasks(prev => prev.map(t =>
                    t.id === data.taskId ? { ...t, status: data.newStatus } : t
                ));
                toast.success(`${data.movedBy} moved a task`, { icon: "🔄" });
            }
        });
        return () => {
            if (pusherClient) pusherClient.unsubscribe(`org-${orgId}`);
        };
    }, [orgId, currentUserId]);

    const handleMoveTask = async (taskId: string, direction: "left" | "right") => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        // Permission check: only admin or assignee can move
        if (!canEdit && task.assignedToId !== currentUserId) {
            toast.error("You can only move tasks assigned to you");
            return;
        }

        const currentIndex = COLUMNS.findIndex(c => c.id === task.status);
        const nextIndex = direction === "right" ? currentIndex + 1 : currentIndex - 1;

        if (nextIndex < 0 || nextIndex >= COLUMNS.length) return;

        const newStatus = COLUMNS[nextIndex].id;

        // Optimistic
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as TaskStatus } : t));

        try {
            await fetch(`/api/tasks/${taskId}/move`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
        } catch (error) {
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: task.status } : t));
        }
    };

    const handleStatusChange = async (taskId: string, status: TaskStatus) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
        try {
            await fetch(`/api/tasks/${taskId}/move`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
        } catch (error) {
            toast.error("Failed to update task");
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm("Are you sure you want to delete this task?")) return;
        setTasks(prev => prev.filter(t => t.id !== taskId));
        try {
            await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
            toast.success("Task deleted");
        } catch (error) {
            toast.error("Failed to delete task");
        }
    };

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const task = tasks.find(t => t.id === draggableId);
        if (!task) return;

        // Permission check: only admin or assignee can move
        if (!canEdit && task.assignedToId !== currentUserId) {
            toast.error("You can only move tasks assigned to you");
            return;
        }

        const oldStatus = task.status;
        const newStatus = destination.droppableId as TaskStatus;

        setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, status: newStatus } : t));

        try {
            const res = await fetch(`/api/tasks/${draggableId}/move`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error();
            if (newStatus === "DONE") {
                setTimeout(() => toast.success("✓ Task completed!", { duration: 3000 }), 500);
            } else {
                toast.success("Task moved");
            }
        } catch {
            toast.error("Error moving task");
            setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, status: oldStatus } : t));
        }
    };

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 overflow-x-auto pb-8 scrollbar-hide">
                    <div className="flex gap-6 h-full min-w-max px-4">
                        {COLUMNS.map((col) => (
                            <KanbanColumn
                                key={col.id}
                                id={col.id as TaskStatus}
                                title={col.title}
                                color={col.color}
                                projectId={project.id}
                                tasks={visibleTasks.filter(t => t.status === col.id)}
                                onTaskClick={(task) => {
                                    setEditTaskData(task);
                                    setIsTaskModalOpen(true);
                                }}
                                onTaskMove={handleMoveTask}
                                onTaskStatusChange={handleStatusChange}
                                onTaskDelete={handleDeleteTask}
                                onAddTask={(status) => {
                                    setEditTaskData(undefined);
                                    setDefaultNewTaskStatus(status);
                                    setIsTaskModalOpen(true);
                                }}
                                canEdit={canEdit}
                                currentUserId={currentUserId}
                                isAdmin={canEdit}
                            />
                        ))}
                    </div>
                </div>
            </DragDropContext>

            <TaskModal
                open={isTaskModalOpen}
                onOpenChange={setIsTaskModalOpen}
                projectId={project.id}
                members={project.members}
                initialData={editTaskData}
                defaultStatus={defaultNewTaskStatus}
                onSuccess={(newTask) => {
                    if (editTaskData) {
                        setTasks(prev => prev.map(t => t.id === newTask.id ? newTask as any : t));
                    } else {
                        setTasks(prev => [newTask as any, ...prev]);
                    }
                }}
            />
        </div>
    );
}
