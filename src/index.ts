import { PrismaClient } from "@prisma/client"
import { ApolloServer } from "apollo-server"
import { exec } from "child_process"
import dotenv from "dotenv"
import util from "util"
import { resolvers } from "./graphql/resolvers"
import { typeDefs } from "./graphql/schema"

dotenv.config();
const prisma = new PrismaClient();
const execAsync = util.promisify(exec);

async function runMigrations() {
  console.log("⏳ Running migrations...");
  await execAsync("npx prisma migrate deploy");
  console.log("✅ Migrations applied");
}

async function seedDefaultUser() {
  const existing = await prisma.user.findUnique({
    where: { email: "admin@example.com" },
  });

  if (!existing) {
    await prisma.user.create({
      data: { name: "Admin User", email: "admin@example.com" },
    });
    console.log("✅ Default user created");
  } else {
    console.log("ℹ️ Default user already exists");
  }
}

async function startServer() {
  await runMigrations();
  await seedDefaultUser();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: () => ({ prisma }),
  });

  const { url } = await server.listen({ port: process.env.PORT || 4000 });
  console.log(`🚀 Server ready at ${url}`);
}

startServer().catch((err) => {
  console.error("❌ Failed to start server", err);
  process.exit(1);
});
