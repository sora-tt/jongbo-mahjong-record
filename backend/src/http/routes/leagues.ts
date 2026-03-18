import { Hono } from "hono";
import type { createDependencies } from "@/app/dependencies.js";
import type { AppBindings } from "@/http/bindings.js";
import { ok } from "@/http/response.js";
import { ensureObject, ensureOptionalString, ensureString, ensureStringArray } from "@/http/validation.js";

type Services = ReturnType<typeof createDependencies>["services"];

export const buildLeaguesRouter = (services: Services) => {
  const app = new Hono<AppBindings>();

  app.get("/", async (c) => ok(c, await services.leagueService.listLeagues(c.get("authUser").uid)));

  app.post("/", async (c) => {
    const body = ensureObject(await c.req.json(), "body");
    return ok(
      c,
      await services.leagueService.createLeague(c.get("authUser").uid, {
        name: ensureString(body.name, "name"),
        ruleId: ensureString(body.ruleId, "ruleId"),
        memberUserIds: ensureStringArray(body.memberUserIds, "memberUserIds"),
      }),
      201
    );
  });

  app.get("/:leagueId", async (c) =>
    ok(c, await services.leagueService.getLeague(c.get("authUser").uid, c.req.param("leagueId")))
  );

  app.patch("/:leagueId", async (c) => {
    const body = ensureObject(await c.req.json(), "body");
    return ok(
      c,
      await services.leagueService.updateLeague(c.get("authUser").uid, c.req.param("leagueId"), {
        name: ensureOptionalString(body.name, "name"),
      })
    );
  });

  app.get("/:leagueId/members", async (c) =>
    ok(c, await services.leagueService.listLeagueMembers(c.get("authUser").uid, c.req.param("leagueId")))
  );

  app.delete("/:leagueId", async (c) => {
    await services.leagueService.deleteLeague(c.get("authUser").uid, c.req.param("leagueId"));
    return c.body(null, 204);
  });

  return app;
};
