import { Hono } from "hono";
import type { createDependencies } from "@/app/dependencies.js";
import type { AppBindings } from "@/http/bindings.js";
import { ok } from "@/http/response.js";
import { ensureObject, ensureOptionalString, ensureString, ensureStringArray } from "@/http/validation.js";

type Services = ReturnType<typeof createDependencies>["services"];

export const buildSeasonsRouter = (services: Services) => {
  const app = new Hono<AppBindings>();

  app.get("/:leagueId/seasons", async (c) =>
    ok(c, await services.seasonService.listSeasons(c.get("authUser").uid, c.req.param("leagueId")))
  );

  app.post("/:leagueId/seasons", async (c) => {
    const body = ensureObject(await c.req.json(), "body");
    return ok(
      c,
      await services.seasonService.createSeason(c.get("authUser").uid, c.req.param("leagueId"), {
        name: ensureString(body.name, "name"),
        memberUserIds: ensureStringArray(body.memberUserIds, "memberUserIds"),
        status:
          body.status === "active" || body.status === "archived"
            ? body.status
            : undefined,
      }),
      201
    );
  });

  app.get("/:leagueId/seasons/:seasonId", async (c) =>
    ok(
      c,
      await services.seasonService.getSeason(c.get("authUser").uid, c.req.param("leagueId"), c.req.param("seasonId"))
    )
  );

  app.patch("/:leagueId/seasons/:seasonId", async (c) => {
    const body = ensureObject(await c.req.json(), "body");
    return ok(
      c,
      await services.seasonService.updateSeason(
        c.get("authUser").uid,
        c.req.param("leagueId"),
        c.req.param("seasonId"),
        {
        name: ensureOptionalString(body.name, "name"),
        status:
          body.status === "active" || body.status === "archived"
            ? body.status
            : undefined,
      })
    );
  });

  app.get("/:leagueId/seasons/:seasonId/members", async (c) =>
    ok(
      c,
      await services.seasonService.listSeasonMembers(
        c.get("authUser").uid,
        c.req.param("leagueId"),
        c.req.param("seasonId")
      )
    )
  );

  app.delete("/:leagueId/seasons/:seasonId", async (c) => {
    await services.seasonService.deleteSeason(
      c.get("authUser").uid,
      c.req.param("leagueId"),
      c.req.param("seasonId")
    );
    return c.body(null, 204);
  });

  return app;
};
