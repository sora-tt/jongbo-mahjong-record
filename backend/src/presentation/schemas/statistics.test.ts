import assert from "node:assert/strict";
import test from "node:test";
import { ValidationError } from "@/domain/shared/errors.js";
import { Hono } from "hono";
import { validateQuery } from "@/presentation/validation.js";
import {
  statisticsAnalysisQuerySchema,
  statisticsMatchHistoryQuerySchema,
  statisticsScopeQuerySchema,
} from "@/presentation/schemas/statistics.js";

const overallScope = { scopeType: "overall" };

test("statistics scope accepts overall, league, and season IDs by scope", () => {
  assert.equal(
    statisticsScopeQuerySchema.safeParse(overallScope).success,
    true,
  );
  assert.equal(
    statisticsScopeQuerySchema.safeParse({
      scopeType: "league",
      leagueId: "league-1",
    }).success,
    true,
  );
  assert.equal(
    statisticsScopeQuerySchema.safeParse({
      scopeType: "season",
      leagueId: "league-1",
      seasonId: "season-1",
    }).success,
    true,
  );
});

test("statistics scope rejects missing, empty, or incompatible IDs", () => {
  for (const query of [
    { scopeType: "league" },
    { scopeType: "league", leagueId: "" },
    { scopeType: "league", leagueId: "league-1", seasonId: "season-1" },
    { scopeType: "season", leagueId: "league-1" },
    { scopeType: "season", leagueId: "", seasonId: "season-1" },
    { scopeType: "season", leagueId: "league-1", seasonId: "" },
    { scopeType: "overall", leagueId: "league-1" },
    { scopeType: "overall", seasonId: "season-1" },
  ]) {
    assert.equal(statisticsScopeQuerySchema.safeParse(query).success, false);
  }
});

test("statistics scope validates ISO datetimes and ordered half-open bounds", () => {
  const from = "2026-03-01T09:00:00+09:00";
  const to = "2026-03-02T00:00:00Z";
  const parsed = statisticsScopeQuerySchema.parse({
    ...overallScope,
    from,
    to,
  });

  assert.equal(parsed.from, from);
  assert.equal(parsed.to, to);
  assert.equal(
    statisticsScopeQuerySchema.safeParse({
      ...overallScope,
      from: to,
      to: from,
    }).success,
    false,
  );
  assert.equal(
    statisticsScopeQuerySchema.safeParse({
      ...overallScope,
      from: "2026-03-01",
    }).success,
    false,
  );
  assert.equal(
    statisticsScopeQuerySchema.safeParse({
      ...overallScope,
      from: "2026-03-01T09:00:00+09:00",
      to: "2026-02-28T23:59:59Z",
    }).success,
    false,
  );
  assert.equal(
    statisticsScopeQuerySchema.safeParse({
      ...overallScope,
      from: "2026-03-01T00:00:00Z",
      to: "2026-03-01T00:00:00Z",
    }).success,
    true,
  );
});

test("statistics scope validates game type and rejects unknown query keys", () => {
  for (const gameType of ["all", "sanma", "yonma"]) {
    assert.equal(
      statisticsScopeQuerySchema.safeParse({ ...overallScope, gameType })
        .success,
      true,
    );
  }
  assert.equal(
    statisticsScopeQuerySchema.safeParse({
      ...overallScope,
      gameType: "fourma",
    }).success,
    false,
  );
  assert.equal(
    statisticsScopeQuerySchema.safeParse({ ...overallScope, unknown: "value" })
      .success,
    false,
  );
});

test("analysis validates dimensions and permits groupBy only for period", () => {
  for (const dimension of [
    "period",
    "weekday",
    "timeOfDay",
    "seat",
    "opponent",
    "session",
  ]) {
    assert.equal(
      statisticsAnalysisQuerySchema.safeParse({
        ...overallScope,
        dimension,
        windowSize: "10",
      }).success,
      true,
    );
  }
  for (const groupBy of ["day", "month", "year"]) {
    assert.equal(
      statisticsAnalysisQuerySchema.safeParse({
        ...overallScope,
        dimension: "period",
        groupBy,
        windowSize: "20",
      }).success,
      true,
    );
  }
  for (const query of [
    { ...overallScope, dimension: "invalid", windowSize: "10" },
    {
      ...overallScope,
      dimension: "period",
      groupBy: "hour",
      windowSize: "10",
    },
    {
      ...overallScope,
      dimension: "weekday",
      groupBy: "day",
      windowSize: "10",
    },
    { ...overallScope, dimension: "weekday" },
  ]) {
    assert.equal(statisticsAnalysisQuerySchema.safeParse(query).success, false);
  }
});

test("analysis parses only supported progression windows from URL strings", () => {
  for (const windowSize of ["10", "20", "50"]) {
    const parsed = statisticsAnalysisQuerySchema.parse({
      ...overallScope,
      dimension: "seat",
      windowSize,
    });
    assert.equal(parsed.windowSize, Number(windowSize));
  }
  for (const windowSize of ["", "0", "15", "10.5", "1e1", "abc"]) {
    assert.equal(
      statisticsAnalysisQuerySchema.safeParse({
        ...overallScope,
        dimension: "seat",
        windowSize,
      }).success,
      false,
    );
  }
});

test("opponent and session breakdowns default to 20 and enforce page bounds", () => {
  for (const dimension of ["opponent", "session"]) {
    const parsed = statisticsAnalysisQuerySchema.parse({
      ...overallScope,
      dimension,
      windowSize: "10",
    });
    assert.equal(parsed.limit, 20);
    assert.equal(
      statisticsAnalysisQuerySchema.parse({
        ...overallScope,
        dimension,
        windowSize: "10",
        limit: "100",
      }).limit,
      100,
    );
    assert.equal(
      statisticsAnalysisQuerySchema.parse({
        ...overallScope,
        dimension,
        windowSize: "10",
        limit: "1",
        cursor: "opaque+/token==",
      }).cursor,
      "opaque+/token==",
    );
  }
  for (const limit of ["0", "101", "1.5", "1e2", "abc"]) {
    assert.equal(
      statisticsAnalysisQuerySchema.safeParse({
        ...overallScope,
        dimension: "opponent",
        windowSize: "10",
        limit,
      }).success,
      false,
    );
  }
  assert.equal(
    statisticsAnalysisQuerySchema.safeParse({
      ...overallScope,
      dimension: "seat",
      windowSize: "10",
      cursor: "opaque-token",
    }).success,
    false,
  );
});

test("history defaults to 50, accepts at most 100, and preserves an opaque cursor", () => {
  assert.equal(statisticsMatchHistoryQuerySchema.parse(overallScope).limit, 50);
  assert.equal(
    statisticsMatchHistoryQuerySchema.parse({ ...overallScope, limit: "100" })
      .limit,
    100,
  );
  assert.equal(
    statisticsMatchHistoryQuerySchema.parse({
      ...overallScope,
      limit: "1",
      cursor: "opaque+/token==",
    }).cursor,
    "opaque+/token==",
  );
  for (const limit of ["0", "101", "1.5", "1e2", "abc"]) {
    assert.equal(
      statisticsMatchHistoryQuerySchema.safeParse({ ...overallScope, limit })
        .success,
      false,
    );
  }
  assert.equal(
    statisticsMatchHistoryQuerySchema.safeParse({ ...overallScope, cursor: "" })
      .success,
    false,
  );
});

test("validateQuery turns an invalid statistics query into ValidationError", async () => {
  const app = new Hono()
    .get("/statistics", validateQuery(statisticsScopeQuerySchema), (context) =>
      context.json({ data: "should not reach handler" }),
    )
    .onError((error, context) => {
      assert.ok(error instanceof ValidationError);
      return context.json({ error: { code: error.code } }, 400);
    });

  const response = await app.request("/statistics?scopeType=season&leagueId=l");
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: { code: "validation_error" },
  });
});
