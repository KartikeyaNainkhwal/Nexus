"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    Users,
    Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/dashboard/projects", icon: FolderKanban },
    { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
    { name: "Members", href: "/dashboard/members", icon: Users },
    { name: "More", href: "/dashboard/settings", icon: Settings },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] glass border-t border-border z-50 px-2 pb-safe flex items-center justify-around bg-bg-surface/90 backdrop-blur-xl">
            {mobileNavItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="relative flex flex-col items-center justify-center w-full h-full gap-1"
                    >
                        {isActive && (
                            <span className="absolute top-1 w-1 h-1 rounded-full bg-accent shadow-glow" />
                        )}
                        <item.icon
                            className={cn(
                                "w-[22px] h-[22px] transition-colors",
                                isActive ? "text-accent" : "text-text-muted"
                            )}
                        />
                        <span
                            className={cn(
                                "text-[10px] font-medium transition-colors",
                                isActive ? "text-accent" : "text-text-muted"
                            )}
                        >
                            {item.name}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
