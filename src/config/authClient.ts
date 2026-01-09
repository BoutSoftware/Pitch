import { createAuthClient } from "better-auth/react"
import { BETTER_AUTH_URL } from ".";

export const authClient = createAuthClient({
    baseURL: BETTER_AUTH_URL,
})
export const { signIn, signUp, useSession, signOut } = authClient;