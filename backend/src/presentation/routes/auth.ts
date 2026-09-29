import {
  AppError,
  UnauthorizedError,
  ValidationError,
} from "@/domain/shared/errors.js";
import { getAdminAuth } from "@/infrastructure/firebase/client.js";
import type { AppBindings } from "@/presentation/bindings.js";
import { ok } from "@/presentation/response.js";
import {
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
  getSessionMaxAgeSeconds,
} from "@/presentation/session.js";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

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

type AuthRouterDependencies = {
  getAdminAuth?: typeof getAdminAuth;
};

export const buildAuthRouter = (
  dependencies: AuthRouterDependencies = { getAdminAuth },
) => {
  const resolveAdminAuth = dependencies.getAdminAuth ?? getAdminAuth;

  return new Hono<AppBindings>()
    .post("/session", async (c) => {
      const idToken = c.req.header("x-id-token")?.trim();
      if (!idToken) {
        throw new UnauthorizedError("x-id-token header is required");
      }
      const expiresIn = getSessionMaxAgeSeconds() * 1000;

      let sessionCookie: string;

      try {
        sessionCookie = await withTimeout(
          resolveAdminAuth().createSessionCookie(idToken, {
            expiresIn,
          }),
          8000,
        );
      } catch {
        throw new UnauthorizedError("invalid authentication token");
      }

      setCookie(
        c,
        SESSION_COOKIE_NAME,
        sessionCookie,
        getSessionCookieOptions(),
      );

      return ok(
        c,
        {
          authenticated: true,
          expiresAt: new Date(Date.now() + expiresIn).toISOString(),
        },
        201,
      );
    })
    .post("/verification-email", async (c) => {
      const sessionCookie = getCookie(c, SESSION_COOKIE_NAME);
      if (!sessionCookie) {
        throw new UnauthorizedError("session cookie is required");
      }

      let decodedToken: {
        uid: string;
        email?: string | null;
        email_verified?: boolean;
      };

      try {
        decodedToken = await withTimeout(
          resolveAdminAuth().verifySessionCookie(sessionCookie, false),
          8000,
        );
      } catch {
        throw new UnauthorizedError("invalid authentication session");
      }

      const uid = decodedToken.uid;
      const email = decodedToken.email?.trim() || null;
      if (!email) {
        throw new ValidationError("user email is required");
      }

      let authenticatedUser: { emailVerified: boolean; email?: string | null };
      try {
        authenticatedUser = await resolveAdminAuth().getUser(uid);
      } catch {
        throw new AppError(
          "failed to read user record",
          500,
          "internal_error",
          {
            uid,
          },
        );
      }

      const currentEmail = authenticatedUser.email?.trim() || email;
      if (!currentEmail) {
        throw new ValidationError("user email is required");
      }

      if (authenticatedUser.emailVerified) {
        throw new AppError("email is already verified", 409, "conflict", {
          uid,
        });
      }

      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000"}/verify-email`;

      let emailVerificationLink: string;
      try {
        emailVerificationLink = await withTimeout(
          resolveAdminAuth().generateEmailVerificationLink(currentEmail, {
            url: verificationUrl,
            handleCodeInApp: false,
          }),
          8000,
        );
      } catch {
        throw new AppError(
          "failed to generate verification email",
          500,
          "internal_error",
          { uid },
        );
      }

      return ok(
        c,
        {
          sent: true,
          email: currentEmail,
          verificationUrl: emailVerificationLink,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
        200,
      );
    })
    .delete("/session", async (c) => {
      deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
      return c.body(null, 204);
    });
};
