"use client";

import { useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  type DropResult,
  type DroppableProvided,
} from "@hello-pangea/dnd";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskCard } from "@/components/kanban/task-card";
import { useKanbanStore, type KanbanColumn } from "@/store/index";
import type { Task, TaskStatus, User } from "@/types";

interface Props {
  projectId: string;
  members: { user: User }[];
  onAddTask: (status: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
}

export function KanbanBoard({ onAddTask, onTaskClick }: Props) {
  const { columns, moveTask, setDraggingTaskId } = useKanbanStore();

  const handleDragStart = useCallback(
    (result: { draggableId: string }) => {
      setDraggingTaskId(result.draggableId);
    },
    [setDraggingTaskId]
  );

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      setDraggingTaskId(null);

      const { source, destination, draggableId } = result;
      if (!destination) return;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      )
        return;

      const sourceStatus = source.droppableId as TaskStatus;
      const destStatus = destination.droppableId as TaskStatus;
      const destIndex = destination.index;

      // Optimistic update
      moveTask(draggableId, sourceStatus, destStatus, destIndex);

      // Persist
      try {
        const res = await fetch(`/api/tasks/${draggableId}/move`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: destStatus,
            position: destIndex,
          }),
        });
        if (!res.ok) throw new Error("move failed");
      } catch {
        // Rollback: move the task back to original position
        moveTask(draggableId, destStatus, sourceStatus, source.index);
      }
    },
    [moveTask, setDraggingTaskId]
  );

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => (
          <Column
            key={col.id}
            column={col}
            onAddTask={() => onAddTask(col.id)}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </DragDropContext>
  );
}

/* ═══════════════════════════════════════
   Single Kanban Column
   ═══════════════════════════════════════ */

function Column({
  column,
  onAddTask,
  onTaskClick,
}: {
  column: KanbanColumn;
  onAddTask: () => void;
  onTaskClick?: (task: Task) => void;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-bg-elevated/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="text-sm font-semibold text-text-primary">
            {column.title}
          </h3>
          <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-bg-surface/10 px-1.5 text-[10px] font-medium text-text-muted">
            {column.tasks.length}
          </span>
        </div>
        <button
          onClick={onAddTask}
          className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={column.id}>
        {(provided: DroppableProvided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 space-y-2 p-3 min-h-[200px] transition-colors duration-200",
              snapshot.isDraggingOver && "bg-accent/[0.03]"
            )}
          >
            {column.tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={onTaskClick}
              />
            ))}
            {provided.placeholder}

            {/* Empty state */}
            {column.tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-xs text-text-muted/60">No tasks yet</p>
                <button
                  onClick={onAddTask}
                  className="mt-2 text-xs text-accent hover:text-accent-light transition-colors"
                >
                  + Add a task
                </button>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
