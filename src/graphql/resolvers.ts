import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();

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
