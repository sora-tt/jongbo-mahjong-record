import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { AppBindings } from "@/presentation/bindings.js";
import { ok } from "@/presentation/response.js";
import {
  createSessionSchema,
  updateSessionSchema,
} from "@/presentation/schemas/session.js";
import type { Services } from "@/presentation/dependencies.js";

export const buildSessionsRouter = (services: Services) =>
  new Hono<AppBindings>()
    .get("/:leagueId/seasons/:seasonId/sessions", async (c) =>
      ok(
        c,
        await services.sessionService.listSessions(
          c.get("authUser").uid,
          c.req.param("leagueId"),
          c.req.param("seasonId"),
        ),
      ),
    )
    .post(
      "/:leagueId/seasons/:seasonId/sessions",
      zValidator("json", createSessionSchema),
      async (c) => {
        const input = c.req.valid("json");
        return ok(
          c,
          await services.sessionService.createSession(
            c.get("authUser").uid,
            c.req.param("leagueId"),
            c.req.param("seasonId"),
            {
              ...input,
              createdBy: c.get("authUser").uid,
            },
          ),
          201,
        );
      },
    )
    .get("/:leagueId/seasons/:seasonId/sessions/:sessionId", async (c) =>
      ok(
        c,
        await services.sessionService.getSession(
          c.get("authUser").uid,
          c.req.param("leagueId"),
          c.req.param("seasonId"),
          c.req.param("sessionId"),
        ),
      ),
    )
    .patch(
      "/:leagueId/seasons/:seasonId/sessions/:sessionId",
      zValidator("json", updateSessionSchema),
      async (c) => {
        const input = c.req.valid("json");
        return ok(
          c,
          await services.sessionService.updateSession(
            c.get("authUser").uid,
            c.req.param("leagueId"),
            c.req.param("seasonId"),
            c.req.param("sessionId"),
            input,
          ),
        );
      },
    )
    .delete("/:leagueId/seasons/:seasonId/sessions/:sessionId", async (c) => {
      await services.sessionService.deleteSession(
        c.get("authUser").uid,
        c.req.param("leagueId"),
        c.req.param("seasonId"),
        c.req.param("sessionId"),
      );
      return c.body(null, 204);
    });
