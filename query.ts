import { prisma } from './lib/prisma'

async function main() {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true } })
    const orgs = await prisma.organization.findMany({ select: { id: true, name: true } })
    const members = await prisma.organizationMember.findMany()

    console.log('--- Users ---')
    console.dir(users, { depth: null })

    console.log('--- Orgs ---')
    console.dir(orgs, { depth: null })

    console.log('--- Members ---')
    console.dir(members, { depth: null })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
