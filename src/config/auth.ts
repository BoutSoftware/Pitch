import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "mongodb", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
    },
    advanced: {
        database: {
            generateId: false
        }
    }
});

export type SessionData = Exclude<Awaited<ReturnType<typeof auth.api.getSession>>, null | undefined>;