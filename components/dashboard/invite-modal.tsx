"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Shield, Users, Loader2, Send, Copy, Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { UpgradeModal } from "@/components/dashboard/upgrade-modal";

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ROLES = [
  {
    value: "MEMBER" as const,
    label: "Member",
    description: "Can view and work on assigned projects and tasks",
    icon: Users,
  },
  {
    value: "ADMIN" as const,
    label: "Admin",
    description: "Can manage members, projects, and organization settings",
    icon: Shield,
  },
];

export function InviteModal({ open, onClose, onSuccess }: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState<{
    resource: "members" | "projects";
    current: number;
    limit: number;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.code === "PLAN_LIMIT_REACHED") {
          onClose();
          setUpgradeInfo({ resource: data.resource, current: data.current, limit: data.limit });
          return;
        }
        throw new Error(data.error || "Failed to send invitation");
      }

      const data = await res.json();
      const link = `${window.location.origin}/invite/${data.token}`;
      setInviteLink(link);
      toast.success(`Invitation created for ${email}`);
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Invite link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (loading) return;
    setEmail("");
    setRole("MEMBER");
    setError("");
    setInviteLink("");
    setCopied(false);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="glass fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl p-6"
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 text-text-muted transition-colors hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header */}
              <div className="mb-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <Send className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-center text-lg font-semibold text-text-primary">
                  Invite Team Member
                </h2>
                <p className="mt-1 text-center text-sm text-text-muted">
                  Send an invitation to join your organization
                </p>
              </div>

              {inviteLink ? (
                /* ── Invite link panel ── */
                <div className="space-y-5">
                  <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-accent" />
                      <p className="text-sm font-medium text-text-primary">Invite link ready</p>
                    </div>
                    <p className="mb-3 text-xs text-text-muted">
                      Share this link with <strong className="text-text-primary">{email}</strong> so they can join your organization.
                    </p>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={inviteLink}
                        className="flex-1 min-w-0 rounded-md border border-bg-elevated bg-bg-base px-3 py-2 text-xs text-text-muted font-mono truncate"
                      />
                      <Button
                        type="button"
                        size="sm"
                        className={cn(
                          "flex-shrink-0 transition-all",
                          copied
                            ? "bg-emerald-500 text-white hover:bg-emerald-500"
                            : "bg-accent text-white hover:bg-accent/90"
                        )}
                        onClick={handleCopyLink}
                      >
                        {copied ? (
                          <><Check className="mr-1.5 h-3.5 w-3.5" /> Copied!</>
                        ) : (
                          <><Copy className="mr-1.5 h-3.5 w-3.5" /> Copy</>
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-center text-xs text-text-muted">
                    This link expires in <strong className="text-text-primary">7 days</strong>.
                  </p>
                  <Button
                    type="button"
                    className="w-full border-bg-elevated text-text-muted hover:bg-bg-elevated hover:text-text-primary"
                    variant="outline"
                    onClick={handleClose}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email input */}
                  <div className="space-y-2">
                    <Label htmlFor="invite-email" className="text-text-primary">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="teammate@company.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError("");
                        }}
                        className={cn(
                          "pl-10 bg-bg-base border-bg-elevated focus:border-accent",
                          error && "border-danger"
                        )}
                        disabled={loading}
                        autoFocus
                      />
                    </div>
                    {error && (
                      <p className="text-xs text-danger">{error}</p>
                    )}
                  </div>

                  {/* Role selector */}
                  <div className="space-y-2">
                    <Label className="text-text-primary">Role</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {ROLES.map(({ value, label, description, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRole(value)}
                          disabled={loading}
                          className={cn(
                            "group relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all",
                            role === value
                              ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                              : "border-bg-elevated bg-bg-base hover:border-text-muted/30"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-lg",
                              role === value ? "bg-accent/10 text-accent" : "bg-bg-elevated text-text-muted"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p
                              className={cn(
                                "text-sm font-medium",
                                role === value ? "text-text-primary" : "text-text-muted"
                              )}
                            >
                              {label}
                            </p>
                            <p className="mt-0.5 text-xs text-text-muted/70 leading-relaxed">
                              {description}
                            </p>
                          </div>
                          {/* Radio indicator */}
                          <div
                            className={cn(
                              "absolute right-3 top-3 h-4 w-4 rounded-full border-2 transition-colors",
                              role === value
                                ? "border-accent bg-accent"
                                : "border-text-muted/30"
                            )}
                          >
                            {role === value && (
                              <div className="absolute inset-0 m-auto h-1.5 w-1.5 rounded-full bg-text-primary" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 border-bg-elevated text-text-muted hover:bg-bg-elevated hover:text-text-primary"
                      onClick={handleClose}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-accent text-white hover:bg-accent/90"
                      disabled={loading || !email.trim()}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Invitation
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <UpgradeModal
        open={!!upgradeInfo}
        onClose={() => setUpgradeInfo(null)}
        resource={upgradeInfo?.resource ?? "members"}
        current={upgradeInfo?.current ?? 0}
        limit={upgradeInfo?.limit ?? 0}
      />
    </>
  );
}
