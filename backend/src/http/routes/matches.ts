import { Hono } from "hono";
import type { createDependencies } from "@/app/dependencies.js";
import type { AppBindings } from "@/http/bindings.js";
import { ValidationError } from "@/errors.js";
import { ok } from "@/http/response.js";
import { ensureIsoDateString, ensureNumber, ensureObject, ensureString } from "@/http/validation.js";

type Services = ReturnType<typeof createDependencies>["services"];

const parseResults = (value: unknown) => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError("results must be a non-empty array");
  }

  return value.map((item, index) => {
    const row = ensureObject(item, `results[${index}]`);
    const wind = ensureString(row.wind, `results[${index}].wind`);
    if (!["east", "south", "west", "north"].includes(wind)) {
      throw new ValidationError("wind must be east, south, west, or north");
    }

    return {
      userId: ensureString(row.userId, `results[${index}].userId`),
      wind: wind as "east" | "south" | "west" | "north",
      rank: ensureNumber(row.rank, `results[${index}].rank`),
      rawScore: ensureNumber(row.rawScore, `results[${index}].rawScore`),
    };
  });
};

export const buildMatchesRouter = (services: Services) => {
  const app = new Hono<AppBindings>();

  app.get("/:leagueId/seasons/:seasonId/sessions/:sessionId/matches", async (c) =>
    ok(
      c,
      await services.matchService.listMatches(
        c.get("authUser").uid,
        c.req.param("leagueId"),
        c.req.param("seasonId"),
        c.req.param("sessionId")
      )
    )
  );

  app.post("/:leagueId/seasons/:seasonId/sessions/:sessionId/matches", async (c) => {
    const body = ensureObject(await c.req.json(), "body");
    return ok(
      c,
      await services.matchService.createMatch(
        c.get("authUser").uid,
        c.req.param("leagueId"),
        c.req.param("seasonId"),
        c.req.param("sessionId"),
        {
        playedAt: ensureIsoDateString(body.playedAt, "playedAt"),
        results: parseResults(body.results),
      }),
      201
    );
  });

  app.get("/:leagueId/seasons/:seasonId/sessions/:sessionId/matches/:matchId", async (c) =>
    ok(
      c,
      await services.matchService.getMatch(
        c.get("authUser").uid,
        c.req.param("leagueId"),
        c.req.param("seasonId"),
        c.req.param("sessionId"),
        c.req.param("matchId")
      )
    )
  );

  app.patch("/:leagueId/seasons/:seasonId/sessions/:sessionId/matches/:matchId", async (c) => {
    const body = ensureObject(await c.req.json(), "body");
    return ok(
      c,
      await services.matchService.updateMatch(
        c.get("authUser").uid,
        c.req.param("leagueId"),
        c.req.param("seasonId"),
        c.req.param("sessionId"),
        c.req.param("matchId"),
        {
          playedAt: body.playedAt === undefined ? undefined : ensureIsoDateString(body.playedAt, "playedAt"),
          results: body.results === undefined ? undefined : parseResults(body.results),
        }
      )
    );
  });

  app.delete("/:leagueId/seasons/:seasonId/sessions/:sessionId/matches/:matchId", async (c) => {
    await services.matchService.deleteMatch(
      c.get("authUser").uid,
      c.req.param("leagueId"),
      c.req.param("seasonId"),
      c.req.param("sessionId"),
      c.req.param("matchId")
    );
    return c.body(null, 204);
  });

  return app;
};
