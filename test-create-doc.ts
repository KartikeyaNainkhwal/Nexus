import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst()
  if (!user) return console.log("No user found")
  
  const org = await prisma.organization.findFirst()
  if (!org) return console.log("No org found")

  try {
    const doc = await prisma.document.create({
      data: {
        organizationId: org.id,
        title: "Test API Doc",
        emoji: "🚀",
        createdById: user.id
      }
    })
    console.log("Document created successfully! ID:", doc.id)
  } catch(e) {
    console.error("Prisma error:", e)
  }
}
main()
