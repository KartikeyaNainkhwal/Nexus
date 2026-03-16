"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageHeaderProps extends HTMLMotionProps<"div"> {
  heading: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  heading,
  description,
  children,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn("flex items-center justify-between pb-8", className)}
      {...props}
    >
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
          {heading}
        </h1>
        {description && (
          <p className="text-sm text-text-muted">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </motion.div>
  );
}
