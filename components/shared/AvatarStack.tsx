"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface AvatarStackItem {
  name: string;
  image?: string | null;
}

interface AvatarStackProps {
  avatars: AvatarStackItem[];
  /** Max visible before "+N" overflow chip */
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

export function AvatarStack({
  avatars,
  max = 4,
  size = "md",
  className,
}: AvatarStackProps) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - max;

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {visible.map((a, i) => (
        <Avatar
          key={i}
          className={cn(
            sizeMap[size],
            "ring-2 ring-surface transition-transform hover:z-10 hover:-translate-y-0.5"
          )}
        >
          <AvatarImage src={a.image ?? undefined} alt={a.name} />
          <AvatarFallback className="bg-bg-hover text-text-muted font-bold">
            {a.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ))}

      {overflow > 0 && (
        <span
          className={cn(
            sizeMap[size],
            "z-10 flex items-center justify-center rounded-full bg-accent-light font-bold text-accent-text ring-2 ring-surface"
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
