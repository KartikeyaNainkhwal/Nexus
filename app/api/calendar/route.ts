import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const eventSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional().nullable(),
    allDay: z.boolean().default(true),
    color: z.string().default("#6366f1"),
    projectId: z.string().optional().nullable().transform(v => v === "" ? null : v),
});

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const start = searchParams.get("start");
        const end = searchParams.get("end");

        if (!start || !end) {
            return NextResponse.json({ error: "Start and end dates are required" }, { status: 400 });
        }

        const startDate = new Date(start.includes(' ') && !start.includes('+') ? start.replace(' ', '+') : start);
        const endDate = new Date(end.includes(' ') && !end.includes('+') ? end.replace(' ', '+') : end);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error("[CALENDAR_GET_INVALID_DATES]", { start, end });
            return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
        }

        const isOrgAdmin = session.user.role === "OWNER" || session.user.role === "ADMIN";

        const projectFilter = isOrgAdmin ? {} : {
            OR: [
                {
                    project: {
                        members: {
                            some: {
                                userId: session.user.id
                            }
                        }
                    }
                },
                { assignedToId: session.user.id }
            ]
        };

        // 1. Fetch Tasks with due dates
        const tasks = await prisma.task.findMany({
            where: {
                organizationId: session.user.organizationId,
                dueDate: {
                    gte: startDate,
                    lte: endDate,
                },
                ...projectFilter
            },
            include: {
                project: { select: { name: true } },
                assignedTo: { select: { name: true } },
            },
        });

        const taskEvents = tasks.map(task => ({
            id: `task-${task.id}`,
            title: task.title,
            start: task.dueDate,
            allDay: true,
            color: task.priority === "HIGH" ? "#ef4444" : task.priority === "MEDIUM" ? "#f59e0b" : "#10b981",
            extendedProps: {
                type: "task",
                status: task.status,
                projectName: task.project.name,
                assignee: task.assignedTo?.name,
                priority: task.priority,
                projectId: task.projectId
            },
        }));

        // 2. Fetch Calendar Events
        const calendarEvents = await prisma.calendarEvent.findMany({
            where: {
                organizationId: session.user.organizationId,
                startDate: {
                    gte: startDate,
                    lte: endDate,
                },
                ...(isOrgAdmin ? {} : {
                    OR: [
                        { projectId: null },
                        {
                            project: {
                                members: {
                                    some: {
                                        userId: session.user.id
                                    }
                                }
                            }
                        }
                    ]
                })
            },
            include: {
                project: { select: { name: true } },
            },
        });

        const formattedEvents = calendarEvents.map(event => ({
            id: `event-${event.id}`,
            title: event.title,
            start: event.startDate,
            end: event.endDate,
            allDay: event.allDay,
            color: event.color,
            extendedProps: {
                type: "event",
                description: event.description,
                projectName: event.project?.name,
            },
        }));

        return NextResponse.json([...taskEvents, ...formattedEvents]);
    } catch (error) {
        console.error("[CALENDAR_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.organizationId || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const result = eventSchema.safeParse(body);

        if (!result.success) {
            console.error("[CALENDAR_POST_VALIDATION]", result.error.format());
            return NextResponse.json({ error: result.error.format() }, { status: 400 });
        }

        const { title, description, startDate, endDate, allDay, color, projectId } = result.data;

        const event = await prisma.calendarEvent.create({
            data: {
                title,
                description,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                allDay,
                color,
                projectId,
                organizationId: session.user.organizationId,
                createdById: session.user.id,
            },
        });

        return NextResponse.json(event);
    } catch (error) {
        console.error("[CALENDAR_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
