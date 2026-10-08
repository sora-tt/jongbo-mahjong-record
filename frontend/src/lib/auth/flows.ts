import {
  createSession,
  deleteSession,
  sendVerificationEmail,
} from "@/lib/api/auth";
import { ApiError } from "@/lib/api/core";
import { createMe, fetchMe } from "@/lib/api/users";
import { loginWithEmail, logout, signupWithEmail } from "@/lib/firebase/auth";

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
  const credential = await loginWithEmail(input.email, input.password);
  const idToken = await credential.user.getIdToken();
  await createSession(idToken);

  if (!credential.user.emailVerified) {
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
  await sendVerificationEmail();

  // Do not block redirect on profile sync. Home page will retry if needed.
  void (async () => {
    try {
      await createMe({ name: input.name, username: input.username });
    } catch (error) {
      if (!isTransientApiFailure(error)) {
        throw error;
      }
    }
  })();

  return "/verify-email?sent=1" as const;
};

export const logoutFromApp = async () => {
  await deleteSession();
  await logout();
};
