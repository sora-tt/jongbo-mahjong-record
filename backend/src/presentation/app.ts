import { AppError } from "@/domain/shared/errors.js";
import type { AppBindings } from "@/presentation/bindings.js";
import { createDependencies } from "@/presentation/dependencies.js";
import { requireAuth } from "@/presentation/middleware/auth.js";
import { openApiDocument } from "@/presentation/openapi.js";
import { buildAuthRouter } from "@/presentation/routes/auth.js";
import { buildLeaguesRouter } from "@/presentation/routes/leagues.js";
import { buildMatchesRouter } from "@/presentation/routes/matches.js";
import { buildRulesRouter } from "@/presentation/routes/rules.js";
import { buildSeasonsRouter } from "@/presentation/routes/seasons.js";
import { buildSessionsRouter } from "@/presentation/routes/sessions.js";
import { buildUsersRouter } from "@/presentation/routes/users.js";
import { swaggerUI } from "@hono/swagger-ui";
import { Hono } from "hono";
import { cors } from "hono/cors";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://127.0.0.1:3000",
  "http://localhost:3000",
];

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
  const { services } = createDependencies();
  const allowedOrigins = getAllowedOrigins();

  return new Hono<AppBindings>()
    .use(
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
    )
    .get("/api/health", (c) =>
      c.json({
        data: {
          status: "ok",
          timestamp: new Date().toISOString(),
        },
      }),
    )
    .get("/doc", (c) => c.json(openApiDocument))
    .get("/ui", swaggerUI({ url: "/doc" }))
    .route("/api/auth", buildAuthRouter())
    .use("/api/rules/*", requireAuth)
    .use("/api/users/*", requireAuth)
    .use("/api/leagues/*", requireAuth)
    .route("/api/rules", buildRulesRouter(services))
    .route("/api/users", buildUsersRouter(services))
    .route("/api/leagues", buildLeaguesRouter(services))
    .route("/api/leagues", buildSeasonsRouter(services))
    .route("/api/leagues", buildSessionsRouter(services))
    .route("/api/leagues", buildMatchesRouter(services))
    .onError((error, c) => {
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
};

export type AppType = ReturnType<typeof createApp>;
