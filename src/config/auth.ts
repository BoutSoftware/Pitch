import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "mongodb",
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
    },
    advanced: {
        database: {
            generateId: false,
        },
    },
    plugins: [
        nextCookies(),
    ],
});

export type SessionData = Exclude<Awaited<ReturnType<typeof auth.api.getSession>>, null | undefined>;