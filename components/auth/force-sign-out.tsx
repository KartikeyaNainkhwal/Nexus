"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { Loader2 } from "lucide-react";

export function ForceSignOut() {
    useEffect(() => {
        signOut({ callbackUrl: "/login" });
    }, []);

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-bg-base">
            <Loader2 className="h-8 w-8 text-accent animate-spin mb-4" />
            <p className="text-text-muted text-sm font-medium animate-pulse">
                Clearing stale session...
            </p>
        </div>
    );
}
