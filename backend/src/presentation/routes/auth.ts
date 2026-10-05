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

const VERIFICATION_EMAIL_COOLDOWN_MS = 60_000;
const VERIFICATION_EMAIL_MAX_ATTEMPTS_PER_DAY = 5;
const VERIFICATION_EMAIL_WINDOW_MS = 24 * 60 * 60 * 1000;

// This rate-limit state is intentionally kept in memory and resets when a server
// instance restarts, which is expected in serverless deployments.
const verificationEmailResendState = new Map<
  string,
  { count: number; lastSentAt: number; windowStartedAt: number }
>();

const getVerificationResendRetryAfterSeconds = (
  uid: string,
  now: number,
): number => {
  const state = verificationEmailResendState.get(uid);
  if (!state) {
    return 0;
  }

  const cooldownRemaining =
    VERIFICATION_EMAIL_COOLDOWN_MS - (now - state.lastSentAt);
  if (cooldownRemaining > 0) {
    return Math.ceil(cooldownRemaining / 1000);
  }

  const windowRemaining =
    VERIFICATION_EMAIL_WINDOW_MS - (now - state.windowStartedAt);
  return Math.max(1, Math.ceil(windowRemaining / 1000));
};

const assertVerificationEmailCanResend = (uid: string, now = Date.now()) => {
  const state = verificationEmailResendState.get(uid);
  if (!state) {
    return;
  }

  const isWithinCooldown =
    now - state.lastSentAt < VERIFICATION_EMAIL_COOLDOWN_MS;
  const isWithinWindow =
    now - state.windowStartedAt < VERIFICATION_EMAIL_WINDOW_MS;

  if (isWithinCooldown) {
    throw new AppError(
      "verification email was sent too recently",
      429,
      "rate_limited",
      {
        uid,
        retryAfterSeconds: getVerificationResendRetryAfterSeconds(uid, now),
      },
    );
  }

  if (
    isWithinWindow &&
    state.count >= VERIFICATION_EMAIL_MAX_ATTEMPTS_PER_DAY
  ) {
    throw new AppError(
      "verification email resend limit exceeded",
      429,
      "rate_limited",
      {
        uid,
        retryAfterSeconds: getVerificationResendRetryAfterSeconds(uid, now),
      },
    );
  }
};

const recordVerificationEmailResend = (uid: string, now = Date.now()) => {
  const previous = verificationEmailResendState.get(uid);
  const isSameWindow =
    previous !== undefined &&
    now - previous.windowStartedAt < VERIFICATION_EMAIL_WINDOW_MS;

  verificationEmailResendState.set(uid, {
    count: previous && isSameWindow ? previous.count + 1 : 1,
    lastSentAt: now,
    windowStartedAt: previous && isSameWindow ? previous.windowStartedAt : now,
  });
};

const clearVerificationEmailResendState = (uid?: string) => {
  if (!uid) {
    return;
  }

  verificationEmailResendState.delete(uid);
};

const normalizeAbsoluteOrigin = (value: string) => {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return "";
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const getPreferredFrontendUrl = (value?: string) => {
  const normalized = normalizeAbsoluteOrigin(value ?? "");
  if (!normalized) {
    return "";
  }

  try {
    const { hostname } = new URL(normalized);
    const isLoopbackHost =
      hostname === "localhost" ||
      hostname === "0.0.0.0" ||
      hostname === "[::1]" ||
      /^127(?:\.\d{1,3}){3}$/.test(hostname);

    if (isLoopbackHost) {
      return "";
    }
  } catch {
    return "";
  }

  return normalized;
};

const getFrontendAppUrl = () => {
  const configuredUrl = getPreferredFrontendUrl(
    process.env.NEXT_PUBLIC_APP_URL,
  );
  if (configuredUrl) {
    return configuredUrl;
  }

  const productionUrl = getPreferredFrontendUrl(
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  );
  if (productionUrl) {
    return productionUrl;
  }

  const vercelBranchUrl = getPreferredFrontendUrl(
    process.env.VERCEL_BRANCH_URL,
  );
  if (vercelBranchUrl) {
    return vercelBranchUrl;
  }

  const vercelUrl = getPreferredFrontendUrl(process.env.VERCEL_URL);
  if (vercelUrl) {
    return vercelUrl;
  }

  return "http://127.0.0.1:3000";
};

const getFrontendAppEnvDebugInfo = () => ({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
  VERCEL_URL: process.env.VERCEL_URL,
  resolvedFrontendAppUrl: getFrontendAppUrl(),
});

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

      const now = Date.now();
      assertVerificationEmailCanResend(uid, now);

      const verificationUrl = `${getFrontendAppUrl()}/verify-email`;

      console.info(
        "[verification-email] generating Firebase verification link",
        {
          uid,
          currentEmail,
          verificationUrl,
          env: getFrontendAppEnvDebugInfo(),
        },
      );

      let emailVerificationLink: string;
      try {
        emailVerificationLink = await withTimeout(
          resolveAdminAuth().generateEmailVerificationLink(currentEmail, {
            url: verificationUrl,
            handleCodeInApp: false,
          }),
          8000,
        );
      } catch (error) {
        console.error(
          "[verification-email] Firebase generateEmailVerificationLink failed",
          {
            uid,
            currentEmail,
            verificationUrl,
            env: getFrontendAppEnvDebugInfo(),
            error:
              error instanceof Error
                ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                  }
                : error,
          },
        );
        throw new AppError(
          "failed to generate verification email",
          500,
          "internal_error",
          { uid },
        );
      }

      recordVerificationEmailResend(uid, now);

      return ok(
        c,
        {
          sent: true,
          email: currentEmail,
          verificationUrl: emailVerificationLink,
          retryAfterSeconds: Math.ceil(VERIFICATION_EMAIL_COOLDOWN_MS / 1000),
          expiresAt: new Date(now + 30 * 60 * 1000).toISOString(),
        },
        200,
      );
    })
    .post("/verify-email", async (c) => {
      const sessionCookie = getCookie(c, SESSION_COOKIE_NAME);
      let sessionUser: { uid: string } | null = null;
      if (sessionCookie) {
        try {
          sessionUser = await withTimeout(
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

      clearVerificationEmailResendState(sessionUser?.uid);

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
