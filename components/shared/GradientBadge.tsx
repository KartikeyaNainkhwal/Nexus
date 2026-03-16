"use client";

import { cn } from "@/lib/utils";

interface GradientBadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function GradientBadge({ children, className }: GradientBadgeProps) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium text-text-primary",
        className
      )}
    >
      {/* gradient border ring */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-accent to-accent-light p-px"
      >
        <span className="block h-full w-full rounded-full bg-bg-surface" />
      </span>

      <span className="relative z-10">{children}</span>
    </span>
  );
}
