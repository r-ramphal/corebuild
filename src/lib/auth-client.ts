import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

// Zelfde origin als de app — geen baseURL nodig.
export const authClient = createAuthClient({
  plugins: [
    twoFactorClient({
      // Bij een account met 2FA aan stuurt de server na het juiste wachtwoord
      // géén sessie maar een "verify two factor"-signaal. Stuur de gebruiker dan
      // naar de TOTP-verificatiepagina (volledige navigatie).
      onTwoFactorRedirect() {
        window.location.href = "/twee-factor";
      },
    }),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  requestPasswordReset,
  resetPassword,
  twoFactor,
} = authClient;
