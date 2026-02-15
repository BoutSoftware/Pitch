import prisma from "@/configs/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { AUTH_SECRET, AUTH_URL } from ".";

export const auth = betterAuth({
    secret: AUTH_SECRET,
    baseURL: AUTH_URL,
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