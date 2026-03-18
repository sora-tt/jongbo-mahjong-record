import { Hono } from "hono";
import type { createDependencies } from "@/app/dependencies.js";
import type { AppBindings } from "@/http/bindings.js";
import { ok } from "@/http/response.js";
import { ensureIsoDateString, ensureObject, ensureString, ensureStringArray } from "@/http/validation.js";

type Services = ReturnType<typeof createDependencies>["services"];

export const buildSessionsRouter = (services: Services) => {
  const app = new Hono<AppBindings>();

  app.get("/:leagueId/seasons/:seasonId/sessions", async (c) =>
    ok(
      c,
      await services.sessionService.listSessions(c.get("authUser").uid, c.req.param("leagueId"), c.req.param("seasonId"))
    )
  );

  app.post("/:leagueId/seasons/:seasonId/sessions", async (c) => {
    const body = ensureObject(await c.req.json(), "body");
    return ok(
      c,
      await services.sessionService.createSession(c.get("authUser").uid, c.req.param("leagueId"), c.req.param("seasonId"), {
        startedAt: ensureIsoDateString(body.startedAt, "startedAt"),
        endedAt: body.endedAt === null ? null : body.endedAt === undefined ? undefined : ensureIsoDateString(body.endedAt, "endedAt"),
        memberUserIds: ensureStringArray(body.memberUserIds, "memberUserIds"),
        tableLabel: body.tableLabel === null ? null : body.tableLabel === undefined ? undefined : ensureString(body.tableLabel, "tableLabel"),
        createdBy: c.get("authUser").uid,
      }),
      201
    );
  });

  app.get("/:leagueId/seasons/:seasonId/sessions/:sessionId", async (c) =>
    ok(
      c,
      await services.sessionService.getSession(
        c.get("authUser").uid,
        c.req.param("leagueId"),
        c.req.param("seasonId"),
        c.req.param("sessionId")
      )
    )
  );

  app.patch("/:leagueId/seasons/:seasonId/sessions/:sessionId", async (c) => {
    const body = ensureObject(await c.req.json(), "body");
    return ok(
      c,
      await services.sessionService.updateSession(
        c.get("authUser").uid,
        c.req.param("leagueId"),
        c.req.param("seasonId"),
        c.req.param("sessionId"),
        {
        endedAt: body.endedAt === null ? null : body.endedAt === undefined ? undefined : ensureIsoDateString(body.endedAt, "endedAt"),
        tableLabel: body.tableLabel === null ? null : body.tableLabel === undefined ? undefined : ensureString(body.tableLabel, "tableLabel"),
      })
    );
  });

  app.delete("/:leagueId/seasons/:seasonId/sessions/:sessionId", async (c) => {
    await services.sessionService.deleteSession(
      c.get("authUser").uid,
      c.req.param("leagueId"),
      c.req.param("seasonId"),
      c.req.param("sessionId")
    );
    return c.body(null, 204);
  });

  return app;
};
