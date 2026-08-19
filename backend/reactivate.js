const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    data: { isActive: true }
  });
  console.log(`Reactivated ${result.count} accounts.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
