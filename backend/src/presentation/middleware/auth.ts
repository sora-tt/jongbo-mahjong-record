import { UnauthorizedError } from "@/domain/shared/errors.js";
import { getAdminAuth } from "@/infrastructure/firebase/client.js";
import type { AppBindings } from "@/presentation/bindings.js";
import { SESSION_COOKIE_NAME } from "@/presentation/session.js";
import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";

const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timer: NodeJS.Timeout | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`operation timed out after ${ms}ms`));
        }, ms);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
};

export const requireAuth: MiddlewareHandler<AppBindings> = async (c, next) => {
  const sessionCookie = getCookie(c, SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    throw new UnauthorizedError("session cookie is required");
  }

  let decodedToken;
  try {
    decodedToken = await withTimeout(
      getAdminAuth().verifySessionCookie(sessionCookie, false),
      8000,
    );
  } catch {
    throw new UnauthorizedError("invalid authentication session");
  }

  c.set("authUser", {
    uid: decodedToken.uid,
    email: typeof decodedToken.email === "string" ? decodedToken.email : null,
    name: typeof decodedToken.name === "string" ? decodedToken.name : null,
    emailVerified: Boolean(decodedToken.email_verified),
  });

  await next();
};
