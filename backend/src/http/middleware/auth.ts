import type { MiddlewareHandler } from "hono";
import { AppError } from "@/errors.js";
import { getAdminAuth } from "@/infrastructure/firebase/auth.js";
import type { AppBindings } from "@/http/bindings.js";

export const requireAuth: MiddlewareHandler<AppBindings> = async (c, next) => {
  const authorization = c.req.header("Authorization");
  if (!authorization) {
    throw new AppError("authorization header is required", 401, "unauthorized");
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new AppError("authorization header must be Bearer token", 401, "unauthorized");
  }

  const decodedToken = await getAdminAuth().verifyIdToken(token);
  c.set("authUser", {
    uid: decodedToken.uid,
    email: typeof decodedToken.email === "string" ? decodedToken.email : null,
    name: typeof decodedToken.name === "string" ? decodedToken.name : null,
    emailVerified: Boolean(decodedToken.email_verified),
  });

  await next();
};
