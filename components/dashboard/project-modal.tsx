"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UpgradeModal } from "@/components/dashboard/upgrade-modal";
import toast from "react-hot-toast";

/* ── Preset colors ── */
const COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
];

/* ── Common emojis ── */
const EMOJIS = [
  "📋", "🚀", "💡", "🎯", "🔥", "⚡", "🎨", "📦",
  "🛠️", "📊", "🌟", "🏗️", "📝", "🔧", "🎉", "💻",
  "📱", "🌐", "🧪", "🔒", "📈", "🤖", "🎮", "🔮",
];

export interface ProjectFormData {
  id?: string;
  name: string;
  description: string | null;
  color: string;
  emoji: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided, modal is in edit mode */
  initialData?: ProjectFormData;
  onSuccess: (project: ProjectFormData & { id: string }) => void;
}

export function ProjectModal({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: Props) {
  const isEdit = !!initialData?.id;

  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [color, setColor] = useState(initialData?.color ?? COLORS[0]);
  const [emoji, setEmoji] = useState(initialData?.emoji ?? EMOJIS[0]);
  const [loading, setLoading] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState<{
    resource: "members" | "projects";
    current: number;
    limit: number;
  } | null>(null);

  // Reset form when dialog opens with new data
  function resetToInitial() {
    setName(initialData?.name ?? "");
    setDescription(initialData?.description ?? "");
    setColor(initialData?.color ?? COLORS[0]);
    setEmoji(initialData?.emoji ?? EMOJIS[0]);
  }

  // Sync state when initialData changes (opening in edit mode)
  useEffect(() => {
    if (open) {
      resetToInitial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    setLoading(true);
    try {
      const payload = { name: name.trim(), description: description.trim() || null, color, emoji };

      const url = isEdit ? `/api/projects/${initialData!.id}` : "/api/projects";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.code === "PLAN_LIMIT_REACHED") {
          setUpgradeInfo({ resource: err.resource, current: err.current, limit: err.limit });
          return;
        }
        throw new Error(err.error ?? "Something went wrong");
      }

      const result = await res.json();
      toast.success(isEdit ? "Project updated" : "Project created");
      onSuccess({ ...payload, id: result.id ?? initialData?.id ?? "" });
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) resetToInitial();
          onOpenChange(v);
        }}
      >
        <DialogContent className="glass border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-text-primary">
              {isEdit ? "Edit Project" : "New Project"}
            </DialogTitle>
            <DialogDescription className="text-text-muted">
              {isEdit
                ? "Update your project details."
                : "Create a new project to organize your tasks."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {/* ── Name ── */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted">
                Project Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Marketing Website"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-text-muted/50 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-colors"
                autoFocus
              />
            </div>

            {/* ── Description ── */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this project about?"
                rows={3}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-text-muted/50 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-colors resize-none"
              />
            </div>

            {/* ── Color picker ── */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="relative h-8 w-8 rounded-lg transition-transform hover:scale-110"
                    style={{ backgroundColor: c }}
                  >
                    {color === c && (
                      <motion.div
                        layoutId="color-ring"
                        className="absolute inset-0 rounded-lg ring-2 ring-white ring-offset-2 ring-offset-bg-base"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Emoji picker ── */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted">Icon</label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-base transition-all ${emoji === e
                      ? "bg-accent/20 ring-1 ring-accent/40 scale-110"
                      : "bg-bg-hover hover:bg-bg-elevated"
                      }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Submit ── */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-text-muted"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !name.trim()}
                className="bg-gradient-to-r from-accent to-accent-light text-white hover:opacity-90 disabled:opacity-50"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Create Project"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <UpgradeModal
        open={!!upgradeInfo}
        onClose={() => setUpgradeInfo(null)}
        resource={upgradeInfo?.resource ?? "projects"}
        current={upgradeInfo?.current ?? 0}
        limit={upgradeInfo?.limit ?? 0}
      />
    </>
  );
}
