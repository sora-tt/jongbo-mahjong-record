import { createSession, deleteSession } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/core";
import { createMe, fetchMe } from "@/lib/api/users";
import {
  loginWithEmail,
  logout,
  sendVerificationEmail as sendFirebaseVerificationEmail,
  signupWithEmail,
} from "@/lib/firebase/auth";

const logAuthDebug = (event: string, detail?: Record<string, unknown>) => {
  if (detail) {
    console.info("[auth-debug]", event, detail);
    return;
  }

  console.info("[auth-debug]", event);
};

const getFallbackUsername = (email: string) =>
  email
    .split("@")[0]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");

const isTransientApiFailure = (error: unknown) => {
  if (!(error instanceof ApiError)) {
    return false;
  }

  if (error.status !== null && (error.status >= 500 || error.status === 429)) {
    return true;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("timed out") ||
    message.includes("invocation_timeout") ||
    message.includes("gateway timeout")
  );
};

export const loginToApp = async (input: {
  email: string;
  password: string;
}) => {
  logAuthDebug("loginToApp:start");
  const credential = await loginWithEmail(input.email, input.password);
  logAuthDebug("loginToApp:firebase-signin-success", {
    uid: credential.user.uid,
  });

  // Refresh user state so emailVerified reflects the latest verification status.
  await credential.user.reload();
  logAuthDebug("loginToApp:user-reloaded", {
    emailVerified: credential.user.emailVerified,
  });

  const idTokenResult = await credential.user.getIdTokenResult(true);
  const isEmailVerified =
    credential.user.emailVerified ||
    idTokenResult.claims.email_verified === true;
  logAuthDebug("loginToApp:verification-evaluated", {
    emailVerifiedProperty: credential.user.emailVerified,
    emailVerifiedClaim: idTokenResult.claims.email_verified === true,
    isEmailVerified,
  });

  await createSession(idTokenResult.token);
  logAuthDebug("loginToApp:session-created");

  if (!isEmailVerified) {
    logAuthDebug("loginToApp:redirect", { nextPath: "/verify-email" });
    return "/verify-email" as const;
  }

  // Do not block redirect on profile sync. Home page has a repair path.
  void (async () => {
    try {
      await fetchMe();
    } catch (error) {
      if (error instanceof ApiError && error.code === "not_found") {
        try {
          await createMe({
            name: credential.user.displayName ?? input.email.split("@")[0],
            username: getFallbackUsername(input.email),
          });
        } catch (createError) {
          if (!isTransientApiFailure(createError)) {
            throw createError;
          }
        }
      } else if (!isTransientApiFailure(error)) {
        throw error;
      }
    }
  })();

  logAuthDebug("loginToApp:redirect", { nextPath: "/" });
  return "/" as const;
};

export const signupToApp = async (input: {
  email: string;
  password: string;
  name: string;
  username: string;
}) => {
  const credential = await signupWithEmail({
    email: input.email,
    password: input.password,
    displayName: input.name,
  });
  const idToken = await credential.user.getIdToken();

  await createSession(idToken);
  await sendFirebaseVerificationEmail(credential.user);

  return "/verify-email?sent=1" as const;
};

export const logoutFromApp = async () => {
  await deleteSession();
  await logout();
};
