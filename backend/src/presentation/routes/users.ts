import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { AppBindings } from "@/presentation/bindings.js";
import { ok } from "@/presentation/response.js";
import { createMeSchema, updateMeSchema } from "@/presentation/schemas/user.js";
import { AppError, ValidationError } from "@/domain/shared/errors.js";
import type { ScopeType } from "@/domain/shared/types.js";
import type { Services } from "@/presentation/dependencies.js";

export const buildUsersRouter = (services: Services) =>
  new Hono<AppBindings>()
    .get("/", async (c) => {
      const query = c.req.query("query") ?? "";
      return ok(c, await services.userService.searchUsers(query));
    })
    .post("/me", zValidator("json", createMeSchema), async (c) => {
      const { name, username } = c.req.valid("json");
      const authUser = c.get("authUser");

      return ok(
        c,
        await services.authService.createMe({
          userId: authUser.uid,
          email: authUser.email,
          name,
          username,
        }),
        201,
      );
    })
    .get("/me", async (c) =>
      ok(c, await services.authService.getMe(c.get("authUser").uid)),
    )
    .patch("/me", zValidator("json", updateMeSchema), async (c) => {
      const input = c.req.valid("json");
      return ok(
        c,
        await services.authService.updateMe({
          userId: c.get("authUser").uid,
          ...input,
        }),
      );
    })
    .get("/:userId", async (c) => {
      const authUser = c.get("authUser");
      const userId = c.req.param("userId");
      if (authUser.uid !== userId) {
        throw new AppError("forbidden", 403, "forbidden", { userId });
      }

      return ok(c, await services.userService.getUser(userId));
    })
    .get("/:userId/joining-seasons", async (c) => {
      const authUser = c.get("authUser");
      const userId = c.req.param("userId");
      if (authUser.uid !== userId) {
        throw new AppError("forbidden", 403, "forbidden", { userId });
      }

      return ok(c, await services.userService.listJoiningSeasons(userId));
    })
    .get("/:userId/stats", async (c) => {
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
