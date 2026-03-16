"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "./Card";

interface MetricCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  trend?: { value: number; positive: boolean };
  className?: string;
}

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf: number;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return { count, ref };
}

export function MetricCard({
  label,
  value,
  prefix = "",
  suffix = "",
  icon,
  trend,
  className,
}: MetricCardProps) {
  const { count, ref } = useCountUp(value);

  return (
    <Card className={cn("relative overflow-hidden group border-border-default", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{label}</p>
          <motion.span
            ref={ref}
            className="block text-3xl font-extrabold tracking-tight text-text-primary font-mono"
          >
            {prefix}
            {count.toLocaleString()}
            {suffix}
          </motion.span>

          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                trend.positive
                  ? "bg-success-bg text-success border-success/20"
                  : "bg-danger-bg text-danger border-danger/20"
              )}
            >
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
          )}
        </div>

        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/5 text-accent border border-accent/10">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
