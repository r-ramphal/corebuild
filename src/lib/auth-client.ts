import { createAuthClient } from "better-auth/react";

// Zelfde origin als de app — geen baseURL nodig
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
