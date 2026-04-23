import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { AppBindings } from "@/presentation/bindings.js";
import { ok } from "@/presentation/response.js";
import {
  createMatchSchema,
  updateMatchSchema,
} from "@/presentation/schemas/match.js";
import type { Services } from "@/presentation/dependencies.js";

export const buildMatchesRouter = (services: Services) =>
  new Hono<AppBindings>()
    .get(
      "/:leagueId/seasons/:seasonId/sessions/:sessionId/matches",
      async (c) =>
        ok(
          c,
          await services.matchService.listMatches(
            c.get("authUser").uid,
            c.req.param("leagueId"),
            c.req.param("seasonId"),
            c.req.param("sessionId"),
          ),
        ),
    )
    .post(
      "/:leagueId/seasons/:seasonId/sessions/:sessionId/matches",
      zValidator("json", createMatchSchema),
      async (c) => {
        const input = c.req.valid("json");
        return ok(
          c,
          await services.matchService.createMatch(
            c.get("authUser").uid,
            c.req.param("leagueId"),
            c.req.param("seasonId"),
            c.req.param("sessionId"),
            input,
          ),
          201,
        );
      },
    )
    .get(
      "/:leagueId/seasons/:seasonId/sessions/:sessionId/matches/:matchId",
      async (c) =>
        ok(
          c,
          await services.matchService.getMatch(
            c.get("authUser").uid,
            c.req.param("leagueId"),
            c.req.param("seasonId"),
            c.req.param("sessionId"),
            c.req.param("matchId"),
          ),
        ),
    )
    .patch(
      "/:leagueId/seasons/:seasonId/sessions/:sessionId/matches/:matchId",
      zValidator("json", updateMatchSchema),
      async (c) => {
        const input = c.req.valid("json");
        return ok(
          c,
          await services.matchService.updateMatch(
            c.get("authUser").uid,
            c.req.param("leagueId"),
            c.req.param("seasonId"),
            c.req.param("sessionId"),
            c.req.param("matchId"),
            input,
          ),
        );
      },
    )
    .delete(
      "/:leagueId/seasons/:seasonId/sessions/:sessionId/matches/:matchId",
      async (c) => {
        await services.matchService.deleteMatch(
          c.get("authUser").uid,
          c.req.param("leagueId"),
          c.req.param("seasonId"),
          c.req.param("sessionId"),
          c.req.param("matchId"),
        );
        return c.body(null, 204);
      },
    );
