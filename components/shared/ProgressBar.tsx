"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  /** 0 – 100 */
  value: number;
  /** Color token class, e.g. "bg-accent" */
  color?: string;
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  color = "bg-accent",
  showLabel = false,
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-bg-elevated">
        <div
          className={cn("h-full rounded-full animate-progress-fill", color)}
          style={
            { "--progress-width": `${clamped}%` } as React.CSSProperties
          }
        />
      </div>
      {showLabel && (
        <span className="min-w-[2.5rem] text-right text-xs font-medium text-text-muted">
          {clamped}%
        </span>
      )}
    </div>
  );
}
