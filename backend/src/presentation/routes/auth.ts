import { UnauthorizedError } from "@/domain/shared/errors.js";
import { getAdminAuth } from "@/infrastructure/firebase/client.js";
import type { AppBindings } from "@/presentation/bindings.js";
import { ok } from "@/presentation/response.js";
import {
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
  getSessionMaxAgeSeconds,
} from "@/presentation/session.js";
import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";

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

export const buildAuthRouter = () =>
  new Hono<AppBindings>()
    .post("/session", async (c) => {
      const idToken = c.req.header("x-id-token")?.trim();
      if (!idToken) {
        throw new UnauthorizedError("x-id-token header is required");
      }
      const expiresIn = getSessionMaxAgeSeconds() * 1000;

      let sessionCookie: string;

      try {
        sessionCookie = await withTimeout(
          getAdminAuth().createSessionCookie(idToken, {
            expiresIn,
          }),
          8000,
        );
      } catch (e) {
        throw new UnauthorizedError("Invalid or expired idToken", {
          originalError: e instanceof Error ? e.message : String(e),
        });
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
    .delete("/session", async (c) => {
      deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
      return c.body(null, 204);
    });
