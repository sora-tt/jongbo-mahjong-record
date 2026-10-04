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

type AuthWithActionCode = ReturnType<typeof getAdminAuth> & {
  applyActionCode?: (oobCode: string) => Promise<{
    data?: { email?: string | null };
  }>;
};

export const buildAuthRouter = (
  dependencies: AuthRouterDependencies = { getAdminAuth },
) => {
  const resolveAdminAuth = dependencies.getAdminAuth ?? getAdminAuth;

  const router = new Hono<AppBindings>().onError((error, c) => {
    if (error instanceof AppError) {
      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            details: error.details ?? {},
          },
        },
        error.status as 400 | 401 | 403 | 404 | 409 | 500,
      );
    }

    console.error(error);
    return c.json(
      {
        error: {
          code: "internal_error",
          message: "internal server error",
          details: {},
        },
      },
      500,
    );
  });

  return router
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
    .post("/verify-email", async (c) => {
      const sessionCookie = getCookie(c, SESSION_COOKIE_NAME);
      if (sessionCookie) {
        try {
          await withTimeout(
            resolveAdminAuth().verifySessionCookie(sessionCookie, false),
            8000,
          );
        } catch {
          throw new UnauthorizedError("invalid authentication session");
        }
      }

      let requestBody: Record<string, unknown> = {};
      try {
        requestBody = (await c.req.json()) as Record<string, unknown>;
      } catch {
        requestBody = {};
      }

      const queryCode = c.req.query("oobCode")?.trim();
      const bodyCode =
        typeof requestBody.oobCode === "string"
          ? requestBody.oobCode.trim()
          : undefined;
      const oobCode = queryCode || bodyCode;

      if (!oobCode) {
        throw new ValidationError("oobCode is required");
      }

      const adminAuth = resolveAdminAuth() as AuthWithActionCode;
      if (typeof adminAuth.applyActionCode !== "function") {
        throw new AppError(
          "email verification is not supported in this environment",
          500,
          "internal_error",
          { oobCode },
        );
      }

      let actionCodeResult: { data?: { email?: string | null } };
      try {
        actionCodeResult = await withTimeout(
          adminAuth.applyActionCode(oobCode),
          8000,
        );
      } catch {
        throw new ValidationError("invalid or expired verification code", {
          oobCode,
        });
      }

      const verifiedEmail =
        typeof actionCodeResult?.data?.email === "string"
          ? actionCodeResult.data.email.trim()
          : null;

      if (!verifiedEmail) {
        throw new ValidationError("verification code did not include an email");
      }

      return ok(
        c,
        {
          verified: true,
          email: verifiedEmail,
          verifiedAt: new Date().toISOString(),
        },
        200,
      );
    })
    .delete("/session", async (c) => {
      deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
      return c.body(null, 204);
    });
};
