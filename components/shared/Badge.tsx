"use client";

import { cn } from "@/lib/utils";

type BadgeVariant =
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "purple";

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
    default:
        "bg-bg-hover border-border-default text-text-secondary",
    success:
        "bg-success-bg border-success/20 text-success",
    warning:
        "bg-warning-bg border-warning/20 text-warning",
    danger:
        "bg-danger-bg border-danger/20 text-danger",
    info:
        "bg-info-bg border-info/20 text-info",
    purple:
        "bg-accent-light border-accent/20 text-accent-text",
};

export function Badge({
    children,
    variant = "default",
    className,
}: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-badge border px-2 py-0.5 text-xs font-medium",
                variantClasses[variant],
                className
            )}
        >
            {children}
        </span>
    );
}
