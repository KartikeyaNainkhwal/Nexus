"use client";

import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import Image from "next/image";

type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
    name?: string | null;
    image?: string | null;
    size?: AvatarSize;
    className?: string;
}

const sizeConfig: Record<
    AvatarSize,
    { px: number; text: string; class: string }
> = {
    sm: { px: 24, text: "text-[9px]", class: "h-6 w-6" },
    md: { px: 32, text: "text-[11px]", class: "h-8 w-8" },
    lg: { px: 40, text: "text-sm", class: "h-10 w-10" },
    xl: { px: 56, text: "text-base", class: "h-14 w-14" },
};

// Deterministic gradient based on name
function nameToGradient(name: string): string {
    const gradients = [
        "from-indigo-500 to-purple-600",
        "from-purple-500 to-pink-600",
        "from-cyan-500 to-blue-600",
        "from-emerald-500 to-teal-600",
        "from-orange-500 to-red-600",
        "from-pink-500 to-rose-600",
    ];
    let hash = 0;
    for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
    return gradients[hash % gradients.length];
}

export function Avatar({ name, image, size = "md", className }: AvatarProps) {
    const cfg = sizeConfig[size];
    const initials = getInitials(name ?? "");
    const gradient = nameToGradient(name ?? "?");

    if (image) {
        return (
            <div
                className={cn(
                    cfg.class,
                    "relative shrink-0 overflow-hidden rounded-full",
                    className
                )}
            >
                <Image
                    src={image}
                    alt={name ?? "avatar"}
                    fill
                    className="object-cover"
                    sizes={`${cfg.px}px`}
                />
            </div>
        );
    }

    return (
        <div
            className={cn(
                cfg.class,
                "shrink-0 rounded-full bg-gradient-to-br flex items-center justify-center font-semibold text-white",
                gradient,
                className
            )}
            aria-label={name ?? "avatar"}
        >
            <span className={cfg.text}>{initials}</span>
        </div>
    );
}
