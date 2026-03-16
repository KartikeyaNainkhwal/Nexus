import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const query = searchParams.get('q')

        if (!query) {
            return NextResponse.json({
                projects: [],
                tasks: [],
                members: [],
                documents: []
            })
        }

        // Get user's org
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { members: true }
        })

        if (!user || user.members.length === 0) {
            return NextResponse.json({
                projects: [],
                tasks: [],
                members: [],
                documents: []
            })
        }

        const orgId = user.members[0].organizationId

        const [projects, tasks, members, documents] = await Promise.all([
            // Projects with task count
            prisma.project.findMany({
                where: {
                    organizationId: orgId,
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 3,
                include: {
                    _count: {
                        select: { tasks: true }
                    }
                }
            }),
            // Tasks with project name
            prisma.task.findMany({
                where: {
                    organizationId: orgId,
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 4,
                include: { project: true }
            }),
            // Members
            prisma.organizationMember.findMany({
                where: {
                    organizationId: orgId,
                    user: {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { email: { contains: query, mode: 'insensitive' } }
                        ]
                    }
                },
                take: 3,
                include: { user: true }
            }),
            // Documents
            prisma.document.findMany({
                where: {
                    organizationId: orgId,
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 3,
                orderBy: { updatedAt: 'desc' }
            })
        ])

        return NextResponse.json({
            projects: projects.map(p => ({
                ...p,
                taskCount: p._count.tasks
            })),
            tasks,
            members: members.map(m => ({
                ...m.user,
                role: m.role
            })),
            documents
        })
    } catch (error) {
        console.error('[SEARCH_ERROR]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
