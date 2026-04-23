import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { AppBindings } from "@/presentation/bindings.js";
import { ok } from "@/presentation/response.js";
import {
  createSeasonSchema,
  updateSeasonSchema,
} from "@/presentation/schemas/season.js";
import type { Services } from "@/presentation/dependencies.js";

export const buildSeasonsRouter = (services: Services) =>
  new Hono<AppBindings>()
    .get("/:leagueId/seasons", async (c) =>
      ok(
        c,
        await services.seasonService.listSeasons(
          c.get("authUser").uid,
          c.req.param("leagueId"),
        ),
      ),
    )
    .post(
      "/:leagueId/seasons",
      zValidator("json", createSeasonSchema),
      async (c) => {
        const input = c.req.valid("json");
        return ok(
          c,
          await services.seasonService.createSeason(
            c.get("authUser").uid,
            c.req.param("leagueId"),
            input,
          ),
          201,
        );
      },
    )
    .get("/:leagueId/seasons/:seasonId", async (c) =>
      ok(
        c,
        await services.seasonService.getSeason(
          c.get("authUser").uid,
          c.req.param("leagueId"),
          c.req.param("seasonId"),
        ),
      ),
    )
    .patch(
      "/:leagueId/seasons/:seasonId",
      zValidator("json", updateSeasonSchema),
      async (c) => {
        const input = c.req.valid("json");
        return ok(
          c,
          await services.seasonService.updateSeason(
            c.get("authUser").uid,
            c.req.param("leagueId"),
            c.req.param("seasonId"),
            input,
          ),
        );
      },
    )
    .get("/:leagueId/seasons/:seasonId/members", async (c) =>
      ok(
        c,
        await services.seasonService.listSeasonMembers(
          c.get("authUser").uid,
          c.req.param("leagueId"),
          c.req.param("seasonId"),
        ),
      ),
    )
    .delete("/:leagueId/seasons/:seasonId", async (c) => {
      await services.seasonService.deleteSeason(
        c.get("authUser").uid,
        c.req.param("leagueId"),
        c.req.param("seasonId"),
      );
      return c.body(null, 204);
    });
