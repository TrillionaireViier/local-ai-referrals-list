const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const snaps = await prisma.referralSnapshot.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log("Recent snaps:", snaps);
  const oldest = await prisma.referralSnapshot.findMany({ orderBy: { createdAt: 'asc' }, take: 5 });
  console.log("Oldest snaps:", oldest);
}
main().catch(console.error).finally(() => prisma.$disconnect());
