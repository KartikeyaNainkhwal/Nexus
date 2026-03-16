"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}

export function DashboardError({ error, reset, title }: DashboardErrorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/[0.12] text-danger"
      >
        <AlertTriangle className="h-8 w-8" />
      </motion.div>

      <h2 className="mb-2 text-xl font-display font-semibold text-white">
        {title ?? "Something went wrong"}
      </h2>
      <p className="mb-1 max-w-sm text-sm text-text-muted leading-relaxed">
        An unexpected error occurred. Please try again or return to the dashboard.
      </p>
      {error.digest && (
        <p className="mb-6 font-mono text-xs text-text-muted/60">
          Error ID: {error.digest}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:text-white hover:border-white/[0.15]"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90"
        >
          <Home className="h-4 w-4" />
          Dashboard
        </Link>
      </div>
    </motion.div>
  );
}
