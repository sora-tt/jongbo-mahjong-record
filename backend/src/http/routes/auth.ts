import { Hono } from "hono";
import type { createDependencies } from "@/app/dependencies.js";
import type { AppBindings } from "@/http/bindings.js";
import { ok } from "@/http/response.js";
import {
  ensureObject,
  ensureOptionalString,
  ensureString,
} from "@/http/validation.js";

type Services = ReturnType<typeof createDependencies>["services"];

export const buildAuthRouter = (services: Services) => {
  const app = new Hono<AppBindings>();

  app.post("/register-profile", async (c) => {
    const body = ensureObject(await c.req.json(), "body");
    const authUser = c.get("authUser");

    return ok(
      c,
      await services.authService.registerProfile({
        userId: authUser.uid,
        email: authUser.email,
        defaultName: authUser.name,
        name: ensureString(body.name, "name"),
        username: ensureOptionalString(body.username, "username"),
      }),
      201,
    );
  });

  return app;
};
