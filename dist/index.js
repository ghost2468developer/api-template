"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const apollo_server_1 = require("apollo-server");
const child_process_1 = require("child_process");
const dotenv_1 = __importDefault(require("dotenv"));
const util_1 = __importDefault(require("util"));
const resolvers_1 = require("./graphql/resolvers");
const schema_1 = require("./graphql/schema");
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const execAsync = util_1.default.promisify(child_process_1.exec);
async function runMigrations() {
    try {
        console.log("⏳ Running migrations...");
        await execAsync("npx prisma migrate deploy");
        console.log("✅ Migrations applied");
    }
    catch (err) {
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
    }
    else {
        console.log("ℹ️ Default user already exists");
    }
}
async function startServer() {
    await runMigrations();
    await seedDefaultUser();
    const server = new apollo_server_1.ApolloServer({
        typeDefs: schema_1.typeDefs,
        resolvers: resolvers_1.resolvers,
        context: () => ({ prisma }),
    });
    const { url } = await server.listen({ port: process.env.PORT || 4000 });
    console.log(`🚀 Server ready at ${url}`);
}
startServer().catch((err) => {
    console.error("❌ Failed to start server", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map