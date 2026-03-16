import { OrgMemberRole, TaskStatus, TaskPriority, SubscriptionPlan } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Seeding database...");

  // Cleanup existing data
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Users
  const hashedPassword = await bcrypt.hash("password123", 12);

  const jordan = await prisma.user.create({
    data: {
      name: "Jordan Lee",
      email: "jordan@acme.com",
      password: hashedPassword,
    },
  });

  const sara = await prisma.user.create({
    data: {
      name: "Sara Kim",
      email: "sara@acme.com",
      password: hashedPassword, // setting for ease of testing
    },
  });

  const marcus = await prisma.user.create({
    data: {
      name: "Marcus Webb",
      email: "marcus@acme.com",
      password: hashedPassword,
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: "Priya Shah",
      email: "priya@acme.com",
      password: hashedPassword,
    },
  });

  // 2. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: "Acme Corp",
      slug: "acme-corp",
      plan: SubscriptionPlan.PRO,
      members: {
        create: [
          { userId: jordan.id, role: OrgMemberRole.OWNER },
          { userId: sara.id, role: OrgMemberRole.ADMIN },
          { userId: marcus.id, role: OrgMemberRole.MEMBER },
          { userId: priya.id, role: OrgMemberRole.MEMBER },
        ],
      },
    },
    include: {
      members: true,
    },
  });

  // 3. Create Projects
  const projectsData = [
    { name: "Website Redesign", emoji: "🎨", color: "#6366f1" },
    { name: "Mobile App MVP", emoji: "📱", color: "#3b82f6" },
    { name: "API Integration", emoji: "⚡", color: "#10b981" },
    { name: "Marketing Dashboard", emoji: "📊", color: "#f59e0b" },
  ];

  const projects = [];
  for (const p of projectsData) {
    const project = await prisma.project.create({
      data: {
        organizationId: org.id,
        name: p.name,
        emoji: p.emoji,
        color: p.color,
        description: `Project for ${p.name}`,
        createdById: jordan.id,
        members: {
          create: [
            { userId: jordan.id },
            { userId: sara.id },
            { userId: marcus.id },
            { userId: priya.id },
          ],
        },
      },
    });
    projects.push(project);
  }

  // 4. Create 20 Tasks
  const users = [jordan, sara, marcus, priya];
  const statuses = [
    TaskStatus.TODO,
    TaskStatus.IN_PROGRESS,
    TaskStatus.IN_REVIEW,
    TaskStatus.DONE,
  ];
  const priorities = [
    TaskPriority.LOW,
    TaskPriority.MEDIUM,
    TaskPriority.HIGH,
  ];

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 2);

  const dates = [null, futureDate, pastDate];

  for (let i = 1; i <= 20; i++) {
    const project = projects[i % 4];
    const assignee = i % 3 === 0 ? null : users[i % 4]; // Some unassigned
    const status = statuses[i % 4];
    const priority = priorities[i % 3];
    const dueDate = dates[i % 3];

    await prisma.task.create({
      data: {
        organizationId: org.id,
        projectId: project.id,
        title: `Task ${i} for ${project.name}`,
        description: `Detailed description for task ${i}`,
        status: status,
        priority: priority,
        assignedToId: assignee?.id,
        createdById: jordan.id,
        dueDate: dueDate,
        position: i * 1024,
      },
    });
  }

  // 5. Create Activity Logs
  const actions = [
    "created_project",
    "completed_task",
    "updated_status",
    "assigned_task",
    "invited_member",
  ];

  for (let i = 0; i < 5; i++) {
    await prisma.activityLog.create({
      data: {
        organizationId: org.id,
        userId: jordan.id,
        action: actions[i],
        entity: "System",
        entityId: "123",
        metadata: { detail: `Activity ${i}` },
      },
    });
  }

  // 6. Create Notifications for Jordan
  for (let i = 0; i < 5; i++) {
    await prisma.notification.create({
      data: {
        userId: jordan.id,
        organizationId: org.id,
        type: "TASK_ASSIGNED",
        message: `You have been assigned to a new task ${i + 1}`,
        link: `/dashboard/tasks`,
      },
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
