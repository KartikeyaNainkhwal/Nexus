"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: [
        "bg-gradient-to-br from-[#6d28d9] to-[#8b5cf6]",
        "text-white font-bold",
        "shadow-primary hover:shadow-primary-hover hover:-translate-y-0.5 active:scale-[0.98]",
        "border border-white/10", // inset highlight equivalent
        "disabled:opacity-60 disabled:cursor-not-allowed",
    ].join(" "),
    secondary: [
        "bg-bg-surface border border-border",
        "text-text-secondary font-bold",
        "hover:bg-bg-hover hover:border-border-strong hover:text-text-primary active:scale-[0.98]",
        "shadow-sm",
        "disabled:opacity-60 disabled:cursor-not-allowed",
    ].join(" "),
    danger: [
        "bg-danger-bg border border-danger/20 text-danger font-bold",
        "hover:bg-danger/20 active:scale-[0.98]",
        "disabled:opacity-60 disabled:cursor-not-allowed",
    ].join(" "),
    ghost: [
        "bg-transparent text-text-muted font-bold",
        "hover:bg-bg-hover hover:text-text-secondary active:scale-[0.98]",
        "disabled:opacity-60 disabled:cursor-not-allowed",
    ].join(" "),
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-xs gap-1.5 rounded-btn",
    md: "h-10 px-4 text-sm gap-2 rounded-btn",
    lg: "h-12 px-6 text-base gap-2.5 rounded-btn",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            children,
            variant = "primary",
            size = "md",
            loading = false,
            icon,
            fullWidth = false,
            className,
            disabled,
            ...props
        },
        ref
    ) => {
        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={cn(
                    "inline-flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 select-none",
                    variantClasses[variant],
                    sizeClasses[size],
                    fullWidth && "w-full",
                    className
                )}
                {...props}
            >
                {loading ? (
                    <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <span>{children}</span>
                    </>
                ) : (
                    <>
                        {icon && <span className="shrink-0">{icon}</span>}
                        {children}
                    </>
                )}
            </button>
        );
    }
);

Button.displayName = "Button";
