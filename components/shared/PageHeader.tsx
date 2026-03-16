"use client";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
    return (
        <div
            className={cn(
                "flex items-start justify-between gap-4",
                className
            )}
        >
            <div className="min-w-0">
                <h1 className="heading text-2xl text-text-primary truncate">{title}</h1>
                {subtitle && (
                    <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
                )}
            </div>

            {action && (
                <div className="flex shrink-0 items-center gap-2">{action}</div>
            )}
        </div>
    );
}
