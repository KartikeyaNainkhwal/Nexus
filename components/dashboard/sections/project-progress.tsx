"use client";

import { motion } from "framer-motion";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { AvatarStack } from "@/components/shared/AvatarStack";
import type { ProjectProgress } from "@/lib/dashboard-data";

interface Props {
  projects: ProjectProgress[];
}

export function ProjectProgressRow({ projects }: Props) {
  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border py-12 text-sm text-text-muted" style={{ background: "var(--bg-hover)" }}>
        No projects yet. Create your first project to get started.
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
      {projects.map((project, i) => {
        const pct =
          project.totalTasks > 0
            ? Math.round((project.doneTasks / project.totalTasks) * 100)
            : 0;

        return (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="glass glass-hover min-w-[260px] shrink-0 rounded-xl p-5 space-y-3"
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg text-base"
                style={{ backgroundColor: `${project.color}15` }}
              >
                {project.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {project.name}
                </p>
                <p className="text-xs text-text-muted">
                  {project.doneTasks}/{project.totalTasks} tasks
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-accent">
                {pct}%
              </span>
            </div>

            {/* Progress */}
            <ProgressBar value={pct} />

            {/* Members */}
            {project.members.length > 0 && (
              <AvatarStack
                avatars={project.members.map((m) => ({
                  name: m.name,
                  image: m.image,
                }))}
                size="sm"
                max={4}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
