import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: "admin@example.com" },
  });

  if (!existing) {
    await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@example.com",
      },
    });
    console.log("✅ Default user created");
  } else {
    console.log("ℹ️ Default user already exists");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
