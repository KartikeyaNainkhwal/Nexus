"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Building2,
  Loader2,
  Mail
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface InviteData {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  organization: {
    id: string;
    name: string;
    logo: string | null;
  };
  invitedBy: {
    name: string | null;
    avatar: string | null;
  };
}

export default function InviteAcceptPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  const [errorType, setErrorType] = useState<"NOT_FOUND" | "EXPIRED" | "ALREADY_ACCEPTED" | null>(null);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);

  useEffect(() => {
    async function verifyToken() {
      try {
        const res = await fetch(`/api/invite/${params.token}`);
        if (!res.ok) {
          if (res.status === 404) setErrorType("NOT_FOUND");
          else if (res.status === 410) {
            const data = await res.json();
            if (data.error.includes("expired")) setErrorType("EXPIRED");
            else setErrorType("ALREADY_ACCEPTED");
          } else {
            setErrorType("NOT_FOUND");
          }
          return;
        }

        const data = await res.json();
        setInviteData(data);
      } catch {
        setErrorType("NOT_FOUND");
      } finally {
        setIsLoading(false);
      }
    }

    if (sessionStatus !== "loading") {
      verifyToken();
    }
  }, [params.token, sessionStatus]);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const res = await fetch(`/api/invite/${params.token}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to accept");

      const data = await res.json();
      if (data.success) {
        toast.success(`Welcome to ${data.organizationName || "the team"}!`);
        router.push("/dashboard");
      }
    } catch {
      toast.error("Failed to accept invitation");
      setIsAccepting(false);
    }
  };

  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // ==== ERROR STATES ====

  if (errorType === "NOT_FOUND") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass p-8 rounded-2xl border border-white/5 max-w-sm w-full text-center relative z-10 bg-white/[0.02]"
        >
          <div className="mx-auto w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mb-6">
            <XCircle className="h-6 w-6 text-danger" />
          </div>
          <h2 className="text-xl font-display font-semibold text-white mb-2">Invalid invitation</h2>
          <p className="text-text-muted text-sm mb-8">This invite link doesn&apos;t exist or has been removed.</p>
          <Link href="/">
            <Button className="w-full" variant="secondary">Go to homepage</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (errorType === "EXPIRED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass p-8 rounded-2xl border border-white/5 max-w-sm w-full text-center relative z-10 bg-white/[0.02]"
        >
          <div className="mx-auto w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-6">
            <Clock className="h-6 w-6 text-orange-500" />
          </div>
          <h2 className="text-xl font-display font-semibold text-white mb-2">Invitation expired</h2>
          <p className="text-text-muted text-sm mb-8">This invite has expired. Please contact the team admin to send a new one.</p>
          <Link href="/">
            <Button className="w-full" variant="secondary">Go to homepage</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (errorType === "ALREADY_ACCEPTED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass p-8 rounded-2xl border border-white/5 max-w-sm w-full text-center relative z-10 bg-white/[0.02]"
        >
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <h2 className="text-xl font-display font-semibold text-white mb-2">Already joined</h2>
          <p className="text-text-muted text-sm mb-8">You&apos;re already a member of this workspace.</p>
          <Link href="/dashboard">
            <Button className="w-full">Go to dashboard</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // ==== VALID INVITE STATE ====

  if (!inviteData) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass p-8 sm:p-10 rounded-2xl border border-white/5 max-w-md w-full text-center relative z-10 bg-white/[0.02] shadow-2xl"
      >
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center mb-6 shadow-lg shadow-accent/20">
          <Building2 className="h-8 w-8 text-white" />
        </div>

        <div className="flex items-center justify-center gap-2 mb-2 text-text-muted">
          {inviteData.invitedBy.avatar ? (
            <Avatar className="h-5 w-5 border border-white/10">
              <AvatarImage src={inviteData.invitedBy.avatar} />
              <AvatarFallback>{inviteData.invitedBy.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-medium text-white">
              {inviteData.invitedBy.name?.[0] || "U"}
            </div>
          )}
          <span className="text-sm">{inviteData.invitedBy.name || "A team member"} invited you to join</span>
        </div>

        <h1 className="text-3xl font-display font-bold mb-4 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          {inviteData.organization.name}
        </h1>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-text-muted mb-8">
          Joining as <span className="text-white">{inviteData.role}</span>
        </div>

        {session?.user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-left mb-6">
              <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-accent" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-0.5">Signed in as</p>
                <p className="text-sm font-medium text-white truncate">{session.user.email}</p>
              </div>
            </div>
            <Button
              className="w-full text-base h-12"
              onClick={handleAccept}
              disabled={isAccepting}
            >
              {isAccepting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Accepting...</>
              ) : (
                "Accept Invitation"
              )}
            </Button>
            <p className="text-xs text-text-muted mt-4">
              Not you? <button onClick={() => toast("Sign out from dashboard first")} className="underline hover:text-white">Sign out</button>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Link href={`/register?inviteToken=${params.token}`} className="block">
              <Button className="w-full text-base h-12 shadow-lg shadow-accent/20">
                Create account & join <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#080810] px-2 text-text-muted">or</span>
              </div>
            </div>
            <Link href={`/login?inviteToken=${params.token}`} className="block">
              <Button variant="secondary" className="w-full bg-white/[0.03] border-white/10 hover:bg-white/[0.06]">
                Sign in to existing account
              </Button>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
