import type { AppBindings } from "@/http/bindings.js";
import { ok } from "@/http/response.js";
import {
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
  getSessionMaxAgeSeconds,
} from "@/http/session.js";
import { ensureObject, ensureString } from "@/http/validation.js";
import { getAdminAuth } from "@/infrastructure/firebase/auth.js";
import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";

export const buildAuthRouter = () => {
  const app = new Hono<AppBindings>();

  app.post("/session", async (c) => {
    const body = ensureObject(await c.req.json(), "body");
    const idToken = ensureString(body.idToken, "idToken");
    const expiresIn = getSessionMaxAgeSeconds() * 1000;

    await getAdminAuth().verifyIdToken(idToken);
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn,
    });

    setCookie(c, SESSION_COOKIE_NAME, sessionCookie, getSessionCookieOptions());

    return ok(
      c,
      {
        authenticated: true,
        expiresAt: new Date(Date.now() + expiresIn).toISOString(),
      },
      201,
    );
  });

  app.delete("/session", async (c) => {
    deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
    return c.body(null, 204);
  });

  return app;
};
