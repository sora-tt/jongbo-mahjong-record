import assert from "node:assert/strict";
import test from "node:test";
import { Hono } from "hono";
import { AppError } from "@/domain/shared/errors.js";
import type { Services } from "@/presentation/dependencies.js";
import type { AppBindings } from "@/presentation/bindings.js";
import { buildUsersRouter } from "@/presentation/routes/users.js";

type StatisticsServiceName =
  | "personalStatisticsSummaryReader"
  | "personalStatisticsAnalysisReader"
  | "personalStatisticsMatchHistoryReader";

type ReaderCall = {
  service: StatisticsServiceName;
  query: Record<string, unknown>;
};

type StatisticsAppOptions = {
  failure?: {
    service: StatisticsServiceName;
    error: AppError;
  };
};

const createStatisticsApp = (options: StatisticsAppOptions = {}) => {
  const calls: ReaderCall[] = [];
  const invoke =
    (service: StatisticsServiceName) =>
    async (query: Record<string, unknown>) => {
      calls.push({ service, query });
      if (options.failure?.service === service) {
        throw options.failure.error;
      }
      return {
        status:
          service === "personalStatisticsSummaryReader"
            ? "empty"
            : service === "personalStatisticsAnalysisReader"
              ? "uncomputed"
              : "ready",
        scope: { scopeType: "overall" },
        generatedAt: "2026-10-03T00:00:00.000Z",
        timeZone: "Asia/Tokyo",
        marker: service,
      };
    };

  const services = {
    personalStatisticsSummaryReader: {
      getSummary: invoke("personalStatisticsSummaryReader"),
    },
    personalStatisticsAnalysisReader: {
      getAnalysis: invoke("personalStatisticsAnalysisReader"),
    },
    personalStatisticsMatchHistoryReader: {
      getMatchHistory: invoke("personalStatisticsMatchHistoryReader"),
    },
  } as unknown as Services;

  const app = new Hono<AppBindings>();
  const usersRouter = buildUsersRouter(services);
  app.use("/api/users/*", async (c, next) => {
    c.set("authUser", {
      uid: "viewer-1",
      email: null,
      name: null,
      emailVerified: false,
    });
    await next();
  });
  app.route("/api/users", usersRouter);
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
    throw error;
  });

  return { app, calls };
};

test("summary route passes viewer, target, and shared filters to its reader", async () => {
  const { app, calls } = createStatisticsApp();
  const response = await app.request(
    "/api/users/target-1/statistics?scopeType=season&leagueId=league-1&seasonId=season-1&from=2026-09-01T00%3A00%3A00Z&gameType=yonma",
  );

  assert.equal(response.status, 200);
  const body = (await response.json()) as {
    data: { status: string; marker: string };
  };
  assert.deepEqual(calls, [
    {
      service: "personalStatisticsSummaryReader",
      query: {
        scopeType: "season",
        leagueId: "league-1",
        seasonId: "season-1",
        from: "2026-09-01T00:00:00Z",
        gameType: "yonma",
        viewerUserId: "viewer-1",
        targetUserId: "target-1",
      },
    },
  ]);
  assert.equal(body.data.status, "empty");
  assert.equal(body.data.marker, "personalStatisticsSummaryReader");
  assert.equal("data" in body, true);
});

test("analysis route preserves parsed filters and uncomputed result status", async () => {
  const { app, calls } = createStatisticsApp();
  const response = await app.request(
    "/api/users/target-2/statistics/analysis?scopeType=league&leagueId=league-2&dimension=period&groupBy=month&windowSize=20&to=2026-10-01T00%3A00%3A00Z",
  );

  assert.equal(response.status, 200);
  const body = (await response.json()) as {
    data: { status: string; marker: string };
  };
  assert.deepEqual(calls, [
    {
      service: "personalStatisticsAnalysisReader",
      query: {
        scopeType: "league",
        leagueId: "league-2",
        dimension: "period",
        groupBy: "month",
        windowSize: 20,
        to: "2026-10-01T00:00:00Z",
        viewerUserId: "viewer-1",
        targetUserId: "target-2",
      },
    },
  ]);
  assert.equal(body.data.status, "uncomputed");
  assert.equal(body.data.marker, "personalStatisticsAnalysisReader");
});

test("history route passes cursor and default page size without reshaping result", async () => {
  const { app, calls } = createStatisticsApp();
  const response = await app.request(
    "/api/users/target-3/statistics/matches?scopeType=overall&gameType=sanma&cursor=opaque-page-token",
  );

  assert.equal(response.status, 200);
  const body = (await response.json()) as {
    data: { status: string; marker: string };
  };
  assert.deepEqual(calls, [
    {
      service: "personalStatisticsMatchHistoryReader",
      query: {
        scopeType: "overall",
        gameType: "sanma",
        limit: 50,
        cursor: "opaque-page-token",
        viewerUserId: "viewer-1",
        targetUserId: "target-3",
      },
    },
  ]);
  assert.equal(body.data.status, "ready");
  assert.equal(body.data.marker, "personalStatisticsMatchHistoryReader");
});

test("invalid statistics queries return the common validation envelope without calling readers", async () => {
  const { app, calls } = createStatisticsApp();
  const invalidPaths = [
    "/api/users/target-1/statistics?scopeType=league",
    "/api/users/target-1/statistics/analysis?scopeType=overall&dimension=unknown",
    "/api/users/target-1/statistics/matches?scopeType=overall&limit=101",
  ];

  for (const path of invalidPaths) {
    const response = await app.request(path);
    assert.equal(response.status, 400);
    const body = (await response.json()) as {
      error: { code: string; message: string; details: { issues: unknown[] } };
    };

    assert.equal(body.error.code, "validation_error");
    assert.equal(body.error.message, "query validation failed");
    assert.ok(body.error.details.issues.length > 0);
  }
  assert.deepEqual(calls, []);
});

test("reader access errors remain standard 403 and 404 error envelopes", async () => {
  const cases = [
    {
      service: "personalStatisticsSummaryReader" as const,
      error: new AppError("forbidden", 403, "forbidden", {
        targetUserId: "target-1",
      }),
      path: "/api/users/target-1/statistics?scopeType=overall",
      status: 403,
      code: "forbidden",
    },
    {
      service: "personalStatisticsSummaryReader" as const,
      error: new AppError("league not found", 404, "not_found", {
        leagueId: "missing-league",
      }),
      path: "/api/users/target-1/statistics?scopeType=league&leagueId=missing-league",
      status: 404,
      code: "not_found",
    },
    {
      service: "personalStatisticsMatchHistoryReader" as const,
      error: new AppError("season not found", 404, "not_found", {
        seasonId: "season-1",
      }),
      path: "/api/users/target-1/statistics/matches?scopeType=season&leagueId=league-1&seasonId=season-1",
      status: 404,
      code: "not_found",
    },
  ];

  for (const item of cases) {
    const { app, calls } = createStatisticsApp({
      failure: { service: item.service, error: item.error },
    });
    const response = await app.request(item.path);
    assert.equal(response.status, item.status);
    const body = (await response.json()) as {
      error: {
        code: string;
        message: string;
        details: Record<string, unknown>;
      };
    };

    assert.equal(body.error.code, item.code);
    assert.deepEqual(body.error.details, item.error.details);
    assert.equal(calls.length, 1);
  }
});
