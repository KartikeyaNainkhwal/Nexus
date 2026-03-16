"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "glass flex flex-col items-center justify-center rounded-xl border-dashed border-bg-elevated p-16 text-center",
        className
      )}
    >
      {/* Illustration / icon */}
      {icon ? (
        <div className="mb-6 text-text-muted">{icon}</div>
      ) : (
        <svg
          className="mb-6 h-28 w-28 text-bg-elevated"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="20" y="30" width="80" height="60" rx="8" className="stroke-accent/30" strokeWidth="2" strokeDasharray="6 4" />
          <circle cx="60" cy="55" r="12" className="stroke-accent-light/40" strokeWidth="2" />
          <path d="M54 55l4 4 8-8" className="stroke-accent" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}

      <h3 className="font-display text-lg font-semibold text-text-primary">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-text-muted">{description}</p>
      {action && <div className="mt-8">{action}</div>}
    </motion.div>
  );
}
