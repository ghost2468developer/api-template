import { PrismaClient } from "@prisma/client"
import { ApolloServer, gql } from "apollo-server"
import { exec } from "child_process"
import dotenv from "dotenv"
import util from "util"

dotenv.config();
const prisma = new PrismaClient();
const execAsync = util.promisify(exec);

// -------------------- GraphQL Schema --------------------
export const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    createdAt: String!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
  }

  type Mutation {
    createUser(name: String!, email: String!): User!
  }
`;

// -------------------- GraphQL Resolvers --------------------
export const resolvers = {
  Query: {
    users: () => prisma.user.findMany(),
    user: (_: any, args: { id: number }) =>
      prisma.user.findUnique({ where: { id: Number(args.id) } }),
  },
  Mutation: {
    createUser: (_: any, args: { name: string; email: string }) =>
      prisma.user.create({ data: args }),
  },
};

// -------------------- Helper Functions --------------------
async function runMigrations() {
  try {
    console.log("⏳ Running migrations...");
    await execAsync("npx prisma migrate deploy");
    console.log("✅ Migrations applied");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  }
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

// -------------------- Start Apollo Server --------------------
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
