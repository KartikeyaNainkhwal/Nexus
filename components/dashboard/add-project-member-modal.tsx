"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { UserPlus, X, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface OrgMember {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string; avatar: string | null };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  existingMemberIds: string[]; // user IDs already in project
  onMemberAdded: (member: { user: { id: string; name: string; avatar: string | null } }) => void;
}

export function AddProjectMemberModal({
  open,
  onOpenChange,
  projectId,
  existingMemberIds,
  onMemberAdded,
}: Props) {
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchOrgMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/members");
      if (res.ok) {
        const data = await res.json();
        setOrgMembers(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setSearch("");
      fetchOrgMembers();
    }
  }, [open, fetchOrgMembers]);

  const available = orgMembers.filter(
    (m) =>
      !existingMemberIds.includes(m.user.id) &&
      (search.trim() === "" ||
        m.user.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.user.email?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = async (userId: string) => {
    try {
      setAdding(userId);
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add member");
      }

      const member = await res.json();
      onMemberAdded(member);
      toast.success("Member added to project");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setAdding(null);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-md glass border border-border rounded-xl p-6 mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-text-primary font-display">
                  Add Project Member
                </h2>
                <p className="text-sm text-text-muted">
                  Add team members to this project
                </p>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="rounded-lg p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-hover py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-colors"
                autoFocus
              />
            </div>

            {/* Members list */}
            <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-1.5">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
                </div>
              ) : available.length === 0 ? (
                <div className="py-8 text-center text-sm text-text-muted">
                  {search.trim()
                    ? "No matching members found"
                    : "All organization members are already in this project"}
                </div>
              ) : (
                available.map((m) => {
                  const initials = m.user.name
                    ? m.user.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
                    : "?";

                  return (
                    <div
                      key={m.userId}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-bg-hover transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {m.user.avatar ? (
                          <Image
                            src={m.user.avatar}
                            alt={m.user.name}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-medium text-accent">
                            {initials}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {m.user.name}
                          </p>
                          <p className="text-xs text-text-muted">{m.user.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAdd(m.user.id)}
                        disabled={adding === m.user.id}
                        className="h-8 gap-1.5 text-xs"
                      >
                        {adding === m.user.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="h-3.5 w-3.5" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
