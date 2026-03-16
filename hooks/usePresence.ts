'use client'

import { useState, useEffect } from 'react'
import { pusherClient } from '@/lib/pusher-client'
import { useSession } from 'next-auth/react'

export interface PresenceUser {
    userId: string
    name: string
    avatar: string | null
    initials: string
    joinedAt: string
}

export function usePresence(pageId: string) {
    const { data: session } = useSession()
    const [presentUsers, setPresentUsers] = useState<PresenceUser[]>([])
    const orgId = session?.user?.organizationId

    useEffect(() => {
        if (!pageId || !orgId || !pusherClient) return

        // Notify others that we joined
        fetch('/api/presence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageId, action: 'join' })
        })

        // Subscribe to presence channel
        // Note: Presence channels in Pusher start with 'presence-'
        const channelName = `presence-${orgId}-${pageId}`
        const channel = pusherClient.subscribe(channelName)

        channel.bind('user-joined', (user: PresenceUser) => {
            setPresentUsers(prev => {
                if (prev.find(u => u.userId === user.userId)) return prev
                return [...prev, user]
            })
        })

        channel.bind('user-left', (user: { userId: string }) => {
            setPresentUsers(prev => prev.filter(u => u.userId !== user.userId))
        })

        // Cleanup on unmount
        return () => {
            fetch('/api/presence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageId, action: 'leave' })
            })
            if (pusherClient) {
                pusherClient.unsubscribe(channelName)
            }
        }
    }, [pageId, orgId])

    return { presentUsers }
}
