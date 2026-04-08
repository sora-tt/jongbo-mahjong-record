import { Hono } from "hono";
import type { createDependencies } from "@/app/dependencies.js";
import type { AppBindings } from "@/http/bindings.js";
import { ok } from "@/http/response.js";
import type { ScopeType } from "@/domain/models.js";
import { AppError, ValidationError } from "@/errors.js";
import {
  ensureObject,
  ensureOptionalString,
  ensureString,
} from "@/http/validation.js";

type Services = ReturnType<typeof createDependencies>["services"];

export const buildUsersRouter = (services: Services) => {
  const app = new Hono<AppBindings>();

  app.get("/", async (c) => {
    const query = c.req.query("query") ?? "";
    return ok(c, await services.userService.searchUsers(query));
  });

  app.post("/me", async (c) => {
    const body = ensureObject(await c.req.json(), "body");
    const authUser = c.get("authUser");

    return ok(
      c,
      await services.authService.createMe({
        userId: authUser.uid,
        email: authUser.email,
        name: ensureString(body.name, "name"),
        username: ensureString(body.username, "username"),
      }),
      201,
    );
  });

  app.get("/me", async (c) =>
    ok(c, await services.authService.getMe(c.get("authUser").uid)),
  );

  app.patch("/me", async (c) => {
    const body = ensureObject(await c.req.json(), "body");
    return ok(
      c,
      await services.authService.updateMe({
        userId: c.get("authUser").uid,
        name: ensureOptionalString(body.name, "name"),
        username: ensureOptionalString(body.username, "username"),
      }),
    );
  });

  app.get("/:userId", async (c) => {
    const authUser = c.get("authUser");
    const userId = c.req.param("userId");
    if (authUser.uid !== userId) {
      throw new AppError("forbidden", 403, "forbidden", { userId });
    }

    return ok(c, await services.userService.getUser(userId));
  });

  app.get("/:userId/joining-seasons", async (c) => {
    const authUser = c.get("authUser");
    const userId = c.req.param("userId");
    if (authUser.uid !== userId) {
      throw new AppError("forbidden", 403, "forbidden", { userId });
    }

    return ok(c, await services.userService.listJoiningSeasons(userId));
  });

  app.get("/:userId/stats", async (c) => {
    const authUser = c.get("authUser");
    const userId = c.req.param("userId");
    if (authUser.uid !== userId) {
      throw new AppError("forbidden", 403, "forbidden", { userId });
    }

    const scopeType = c.req.query("scopeType") as ScopeType | undefined;
    if (!scopeType || !["overall", "league", "season"].includes(scopeType)) {
      throw new ValidationError(
        "scopeType must be one of overall, league, season",
      );
    }

    return ok(
      c,
      await services.userService.getUserStats({
        userId,
        scopeType,
        leagueId: c.req.query("leagueId") ?? undefined,
        seasonId: c.req.query("seasonId") ?? undefined,
      }),
    );
  });

  return app;
};
