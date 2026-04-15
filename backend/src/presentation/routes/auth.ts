import { UnauthorizedError } from "@/domain/shared/errors.js";
import { getAdminAuth } from "@/infrastructure/firebase/client.js";
import type { AppBindings } from "@/presentation/bindings.js";
import { ok } from "@/presentation/response.js";
import { createSessionAuthSchema } from "@/presentation/schemas/user.js";
import {
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
  getSessionMaxAgeSeconds,
} from "@/presentation/session.js";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";

export const buildAuthRouter = () =>
  new Hono<AppBindings>()
    .post(
      "/session",
      zValidator("json", createSessionAuthSchema),
      async (c) => {
        const { idToken } = c.req.valid("json");
        const expiresIn = getSessionMaxAgeSeconds() * 1000;

        let sessionCookie: string;

        try {
          await getAdminAuth().verifyIdToken(idToken);

          sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
            expiresIn,
          });
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
      },
    )
    .delete("/session", async (c) => {
      deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
      return c.body(null, 204);
    });
