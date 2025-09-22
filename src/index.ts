import { PrismaClient } from "@prisma/client"
import { ApolloServer, gql } from "apollo-server"
import bcrypt from "bcrypt"
import { exec } from "child_process"
import dotenv from "dotenv"
import jwt from "jsonwebtoken"
import util from "util"

dotenv.config()
const prisma = new PrismaClient()
const execAsync = util.promisify(exec)

// Helper to extract userId from JWT
const getUserId = (token: string) => {
  if (!token) return null
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!)
    return decoded.userId
  } catch {
    return null
  }
}

// GraphQL schema
export const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
    me: User
  }

  type Mutation {
    createUser(name: String!, email: String!, password: String!): User!
    login(email: String!, password: String!): AuthPayload!
  }
`

// Resolvers
export const resolvers = {
  Query: {
    users: (_: any, __: any, { prisma }: any) => prisma.user.findMany(),
    user: (_: any, args: { id: number }, { prisma }: any) =>
      prisma.user.findUnique({ where: { id: Number(args.id) } }),
    me: async (_: any, __: any, { prisma, req }: any) => {
      const token = req.headers.authorization?.split(" ")[1]
      const userId = getUserId(token)
      if (!userId) return null
      return prisma.user.findUnique({ where: { id: userId } })
    }
  },
  Mutation: {
    createUser: async (_: any, args: { name: string; email: string; password: string }, { prisma }: any) => {
      const hashedPassword = await bcrypt.hash(args.password, 10)
      return prisma.user.create({ data: { ...args, password: hashedPassword } })
    },
    login: async (_: any, args: { email: string; password: string }, { prisma }: any) => {
      const user = await prisma.user.findUnique({ where: { email: args.email } })
      if (!user) throw new Error("Invalid credentials")
      const valid = await bcrypt.compare(args.password, user.password)
      if (!valid) throw new Error("Invalid credentials")
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "1h" })
      return { token, user }
    }
  }
}

// Run migrations
async function runMigrations() {
  try {
    console.log("⏳ Running migrations...")
    await execAsync("npx prisma migrate deploy")
    console.log("✅ Migrations applied")
  } catch (err) {
    console.error("❌ Migration failed:", err)
  }
}

// Seed default user
async function seedDefaultUser() {
  const existing = await prisma.user.findUnique({
    where: { email: "admin@example.com" }
  })

  if (!existing) {
    const hashedPassword = await bcrypt.hash("admin123", 10)
    await prisma.user.create({
      data: { name: "Admin User", email: "admin@example.com", password: hashedPassword }
    })
    console.log("✅ Default user created")
  } else {
    console.log("ℹ️ Default user already exists")
  }
}

// Start Apollo Server
async function startServer() {
  await runMigrations()
  await seedDefaultUser()

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({ prisma, req })
  })

  const { url } = await server.listen({ port: process.env.PORT || 4000 })
  console.log(`🚀 Server ready at ${url}`)
}

startServer().catch((err) => {
  console.error("❌ Failed to start server", err)
  process.exit(1)
})
