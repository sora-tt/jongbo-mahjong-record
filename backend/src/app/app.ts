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

const DEFAULT_ALLOWED_ORIGINS = ["http://127.0.0.1:3000", "http://localhost:3000"];

const getAllowedOrigins = () => {
  const raw = process.env.CORS_ALLOWED_ORIGINS;
  if (!raw) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
};

export const createApp = () => {
  const app = new Hono<AppBindings>();
  const { services } = createDependencies();
  const allowedOrigins = getAllowedOrigins();

  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (!origin) {
          return undefined;
        }

        return allowedOrigins.includes(origin) ? origin : undefined;
      },
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type"],
      maxAge: 600,
      credentials: true,
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

  app.route("/api/auth", buildAuthRouter(services));
  app.use("/api/rules/*", requireAuth);
  app.use("/api/users/*", requireAuth);
  app.use("/api/leagues/*", requireAuth);

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
