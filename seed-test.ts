import { PrismaClient, SubscriptionPlan, OrgMemberRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'testuser@example.com';
    const password = 'Password123!';
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            name: 'Test Setup User',
            email,
            password: hashedPassword,
            aiRequestsThisMonth: 0,
        },
    });

    const org = await prisma.organization.create({
        data: {
            name: 'Test Workspace',
            slug: 'test-workspace-' + Date.now(),
            plan: SubscriptionPlan.PRO,
        },
    });

    await prisma.organizationMember.create({
        data: {
            userId: user.id,
            organizationId: org.id,
            role: OrgMemberRole.OWNER,
        },
    });

    console.log('Test user created: ', email, ' / ', password);
    console.log('Org ID:', org.id);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
