'use client'

import { usePresence } from "@/hooks/usePresence"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Props {
    pageId: string
    className?: string
}

const GRADIENTS = [
    "from-[#FF5F6D] to-[#FFC371]",
    "from-[#2193b0] to-[#6dd5ed]",
    "from-[#ee9ca7] to-[#ffdde1]",
    "from-[#06beb6] to-[#48b1bf]",
    "from-[#614385] to-[#516395]",
    "from-[#02aab0] to-[#00cdac]"
]

const getGradient = (userId: string) => {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

export function PresenceAvatars({ pageId, className }: Props) {
    const { presentUsers } = usePresence(pageId)
    const { data: session } = useSession()
    const currentUserId = session?.user?.id

    // Filter out current user for the display
    const others = presentUsers.filter(u => u.userId !== currentUserId)
    if (others.length === 0) return null

    const displayUsers = others.slice(0, 4)
    const remainingCount = others.length - 4

    return (
        <div className={cn("flex items-center -space-x-2", className)}>
            <TooltipProvider delayDuration={0}>
                <AnimatePresence mode="popLayout">
                    {displayUsers.map((user) => (
                        <Tooltip key={user.userId}>
                            <TooltipTrigger asChild>
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className={cn(
                                        "relative h-7 w-7 rounded-full border-2 border-bg-surface bg-gradient-to-br flex items-center justify-center text-[10px] font-bold text-white shadow-sm cursor-help",
                                        getGradient(user.userId)
                                    )}
                                >
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt={user.name}
                                            className="h-full w-full rounded-full object-cover"
                                        />
                                    ) : (
                                        user.initials
                                    )}
                                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border border-bg-surface" />
                                </motion.div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="flex items-center gap-2 p-2 bg-surface border border-border">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold">{user.name}</span>
                                    <span className="text-[10px] text-text-muted">Viewing this page</span>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    ))}

                    {remainingCount > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="h-7 w-7 rounded-full border-2 border-bg-surface bg-bg-elevated flex items-center justify-center text-[10px] font-bold text-text-muted transition-colors hover:bg-bg-hover cursor-help"
                                >
                                    +{remainingCount}
                                </motion.div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="p-2 bg-surface border border-border">
                                <span className="text-xs font-medium">
                                    And {remainingCount} other{remainingCount > 1 ? 's' : ''} here
                                </span>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </AnimatePresence>
            </TooltipProvider>

            {others.length >= 2 && (
                <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-3 text-[11px] font-medium text-text-muted whitespace-nowrap hidden sm:block"
                >
                    {others.length} people here
                </motion.span>
            )}
        </div>
    )
}
