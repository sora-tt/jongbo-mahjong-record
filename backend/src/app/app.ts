import { swaggerUI } from "@hono/swagger-ui";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { AppError } from "@/errors.js";
import { requireAuth } from "@/http/middleware/auth.js";
import type { AppBindings } from "@/http/bindings.js";
import { openApiDocument } from "@/http/openapi.js";
import { buildAuthRouter } from "@/http/routes/auth.js";
import { buildLeaguesRouter } from "@/http/routes/leagues.js";
import { buildMatchesRouter } from "@/http/routes/matches.js";
import { buildRulesRouter } from "@/http/routes/rules.js";
import { buildSeasonsRouter } from "@/http/routes/seasons.js";
import { buildSessionsRouter } from "@/http/routes/sessions.js";
import { buildUsersRouter } from "@/http/routes/users.js";
import { createDependencies } from "@/app/dependencies.js";

export const createApp = () => {
  const app = new Hono<AppBindings>();
  const { services } = createDependencies();

  app.use(
    "*",
    cors({
      origin: "*",
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.get("/api/health", (c) =>
    c.json({
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
      },
    }),
  );

  app.get("/doc", (c) => c.json(openApiDocument));
  app.get("/ui", swaggerUI({ url: "/doc" }));

  app.use("/api/auth/*", requireAuth);
  app.use("/api/rules/*", requireAuth);
  app.use("/api/users/*", requireAuth);
  app.use("/api/leagues/*", requireAuth);

  app.route("/api/auth", buildAuthRouter(services));
  app.route("/api/rules", buildRulesRouter(services));
  app.route("/api/users", buildUsersRouter(services));
  app.route("/api/leagues", buildLeaguesRouter(services));
  app.route("/api/leagues", buildSeasonsRouter(services));
  app.route("/api/leagues", buildSessionsRouter(services));
  app.route("/api/leagues", buildMatchesRouter(services));

  app.onError((error, c) => {
    if (error instanceof AppError) {
      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            details: error.details ?? {},
          },
        },
        error.status as 400 | 401 | 403 | 404 | 409 | 500,
      );
    }

    console.error(error);
    return c.json(
      {
        error: {
          code: "internal_error",
          message: "internal server error",
          details: {},
        },
      },
      500,
    );
  });

  return app;
};
