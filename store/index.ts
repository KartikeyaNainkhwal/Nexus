import { create } from "zustand";
import type { Organization, Project, Task, TaskStatus } from "@/types";

/* ═══════════════════════════════════════
   App-wide store
   ═══════════════════════════════════════ */

interface AppState {
  // Active organization
  organization: Organization | null;
  setOrganization: (org: Organization | null) => void;

  // Projects
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  organization: null,
  setOrganization: (organization) => set({ organization }),

  projects: [],
  setProjects: (projects) => set({ projects }),
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),

  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));

/* ═══════════════════════════════════════
   Kanban board store
   ═══════════════════════════════════════ */

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
}

const COLUMN_META: { id: TaskStatus; title: string; color: string }[] = [
  { id: "TODO", title: "To Do", color: "#64748b" },
  { id: "IN_PROGRESS", title: "In Progress", color: "#6366f1" },
  { id: "IN_REVIEW", title: "In Review", color: "#f59e0b" },
  { id: "DONE", title: "Done", color: "#10b981" },
];

interface KanbanState {
  columns: KanbanColumn[];
  draggingTaskId: string | null;

  /** Initialise columns from a flat task list */
  initFromTasks: (tasks: Task[]) => void;

  /** Add a task to a column */
  addTask: (task: Task) => void;

  /** Remove a task */
  removeTask: (taskId: string) => void;

  /** Update a task in place */
  updateTask: (taskId: string, updates: Partial<Task>) => void;

  /** Optimistic move — reorder within / across columns */
  moveTask: (
    taskId: string,
    sourceStatus: TaskStatus,
    destStatus: TaskStatus,
    destIndex: number
  ) => void;

  setDraggingTaskId: (id: string | null) => void;
}

export const useKanbanStore = create<KanbanState>((set) => ({
  columns: COLUMN_META.map((c) => ({ ...c, tasks: [] })),
  draggingTaskId: null,

  initFromTasks: (tasks) =>
    set({
      columns: COLUMN_META.map((col) => ({
        ...col,
        tasks: tasks
          .filter((t) => t.status === col.id)
          .sort((a, b) => a.position - b.position),
      })),
    }),

  addTask: (task) =>
    set((state) => ({
      columns: state.columns.map((col) =>
        col.id === task.status ? { ...col, tasks: [...col.tasks, task] } : col
      ),
    })),

  removeTask: (taskId) =>
    set((state) => ({
      columns: state.columns.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.id !== taskId),
      })),
    })),

  updateTask: (taskId, updates) =>
    set((state) => ({
      columns: state.columns.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) =>
          t.id === taskId ? { ...t, ...updates } : t
        ),
      })),
    })),

  moveTask: (taskId, sourceStatus, destStatus, destIndex) =>
    set((state) => {
      const newColumns = state.columns.map((col) => ({
        ...col,
        tasks: [...col.tasks],
      }));

      // Remove from source
      const srcCol = newColumns.find((c) => c.id === sourceStatus)!;
      const taskIdx = srcCol.tasks.findIndex((t) => t.id === taskId);
      if (taskIdx === -1) return state;
      const [task] = srcCol.tasks.splice(taskIdx, 1);

      // Update status
      task.status = destStatus;

      // Insert at dest
      const destCol = newColumns.find((c) => c.id === destStatus)!;
      destCol.tasks.splice(destIndex, 0, task);

      // Reassign positions
      destCol.tasks.forEach((t, i) => {
        t.position = i;
      });
      if (sourceStatus !== destStatus) {
        srcCol.tasks.forEach((t, i) => {
          t.position = i;
        });
      }

      return { columns: newColumns };
    }),

  setDraggingTaskId: (id) => set({ draggingTaskId: id }),
}));

