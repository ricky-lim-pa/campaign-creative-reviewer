/**
 * Wipe all comments from the database (mockups and approvals are preserved).
 *
 * Usage: npm run db:wipe-comments
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.comment.deleteMany();
  console.log(`Deleted ${result.count} comment(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
