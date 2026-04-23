import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { AppBindings } from "@/presentation/bindings.js";
import { ok } from "@/presentation/response.js";
import {
  createLeagueSchema,
  updateLeagueSchema,
} from "@/presentation/schemas/league.js";
import type { Services } from "@/presentation/dependencies.js";

export const buildLeaguesRouter = (services: Services) =>
  new Hono<AppBindings>()
    .get("/", async (c) =>
      ok(c, await services.leagueService.listLeagues(c.get("authUser").uid)),
    )
    .post("/", zValidator("json", createLeagueSchema), async (c) => {
      const input = c.req.valid("json");
      return ok(
        c,
        await services.leagueService.createLeague(c.get("authUser").uid, input),
        201,
      );
    })
    .get("/:leagueId", async (c) =>
      ok(
        c,
        await services.leagueService.getLeague(
          c.get("authUser").uid,
          c.req.param("leagueId"),
        ),
      ),
    )
    .patch("/:leagueId", zValidator("json", updateLeagueSchema), async (c) => {
      const input = c.req.valid("json");
      return ok(
        c,
        await services.leagueService.updateLeague(
          c.get("authUser").uid,
          c.req.param("leagueId"),
          input,
        ),
      );
    })
    .get("/:leagueId/members", async (c) =>
      ok(
        c,
        await services.leagueService.listLeagueMembers(
          c.get("authUser").uid,
          c.req.param("leagueId"),
        ),
      ),
    )
    .delete("/:leagueId", async (c) => {
      await services.leagueService.deleteLeague(
        c.get("authUser").uid,
        c.req.param("leagueId"),
      );
      return c.body(null, 204);
    });
