import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { AppError } from "@/errors.js";
import { getAdminAuth } from "@/infrastructure/firebase/auth.js";
import type { AppBindings } from "@/http/bindings.js";
import { SESSION_COOKIE_NAME } from "@/http/session.js";

export const requireAuth: MiddlewareHandler<AppBindings> = async (c, next) => {
  const sessionCookie = getCookie(c, SESSION_COOKIE_NAME);
  if (!sessionCookie) {
    throw new AppError("session cookie is required", 401, "unauthorized");
  }

  const decodedToken = await getAdminAuth().verifySessionCookie(sessionCookie, false);
  c.set("authUser", {
    uid: decodedToken.uid,
    email: typeof decodedToken.email === "string" ? decodedToken.email : null,
    name: typeof decodedToken.name === "string" ? decodedToken.name : null,
    emailVerified: Boolean(decodedToken.email_verified),
  });

  await next();
};
