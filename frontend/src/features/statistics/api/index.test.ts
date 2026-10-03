import { deepStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import {
  getPersonalStatisticsAnalysis,
  getPersonalStatisticsSummary,
  getStatisticsMatchHistory,
  listStatisticsLeagueMembers,
  listStatisticsSeasonMembers,
  type PersonalStatisticsAnalysisQuery,
  type PersonalStatisticsSummaryQuery,
  type StatisticsMatchHistoryQuery,
} from "./index";

type FetchCall = { url: URL; init?: RequestInit };

const withMockedFetch = async <T>(
  responseData: unknown,
  operation: (calls: FetchCall[]) => Promise<T>
) => {
  const calls: FetchCall[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const requestUrl =
      input instanceof Request
        ? input.url
        : input instanceof URL
          ? input.toString()
          : String(input);
    calls.push({ url: new URL(requestUrl), init });
    return Response.json({ data: responseData });
  };

  try {
    return await operation(calls);
  } finally {
    globalThis.fetch = originalFetch;
  }
};

test("summary API uses the selected target and preserves scope filters", async () => {
  const query = {
    scopeType: "season",
    leagueId: "league-1",
    seasonId: "season-1",
    from: "2026-01-01T00:00:00.000Z",
    to: "2026-02-01T00:00:00.000Z",
    gameType: "sanma",
  } satisfies PersonalStatisticsSummaryQuery;
  const response = {
    status: "empty",
    scope: { scopeType: "season", leagueId: "league-1", seasonId: "season-1" },
    generatedAt: "2026-02-02T00:00:00.000Z",
    timeZone: "Asia/Tokyo",
  };

  const result = await withMockedFetch(response, async (calls) => {
    const data = await getPersonalStatisticsSummary({
      targetUserId: "target-user",
      query,
    });
    strictEqual(calls.length, 1);
    strictEqual(calls[0]?.url.pathname, "/api/users/target-user/statistics");
    strictEqual(calls[0]?.url.searchParams.get("scopeType"), "season");
    strictEqual(calls[0]?.url.searchParams.get("leagueId"), "league-1");
    strictEqual(calls[0]?.url.searchParams.get("seasonId"), "season-1");
    strictEqual(calls[0]?.url.searchParams.get("gameType"), "sanma");
    strictEqual(
      calls[0]?.url.searchParams.get("from"),
      "2026-01-01T00:00:00.000Z"
    );
    return data;
  });

  deepStrictEqual(result, response);
});

test("analysis API forwards the selected dimension and progression window", async () => {
  const query = {
    scopeType: "overall",
    dimension: "period",
    groupBy: "month",
    windowSize: "20",
  } satisfies PersonalStatisticsAnalysisQuery;
  const response = { status: "uncomputed", generatedAt: null };

  const result = await withMockedFetch(response, async (calls) => {
    const data = await getPersonalStatisticsAnalysis({
      targetUserId: "user-2",
      query,
    });
    strictEqual(
      calls[0]?.url.pathname,
      "/api/users/user-2/statistics/analysis"
    );
    strictEqual(calls[0]?.url.searchParams.get("dimension"), "period");
    strictEqual(calls[0]?.url.searchParams.get("groupBy"), "month");
    strictEqual(calls[0]?.url.searchParams.get("windowSize"), "20");
    return data;
  });

  deepStrictEqual(result, response);
});

test("history API forwards the opaque cursor and page size unchanged", async () => {
  const query = {
    scopeType: "overall",
    limit: "50",
    cursor: "cursor%2Fopaque+value",
  } satisfies StatisticsMatchHistoryQuery;
  const response = {
    status: "ready",
    items: [{ match: { matchId: "match-1" } }],
    nextCursor: "next-cursor",
  };

  const result = await withMockedFetch(response, async (calls) => {
    const data = await getStatisticsMatchHistory({
      targetUserId: "user-3",
      query,
    });
    strictEqual(calls[0]?.url.pathname, "/api/users/user-3/statistics/matches");
    strictEqual(
      calls[0]?.url.searchParams.get("cursor"),
      "cursor%2Fopaque+value"
    );
    strictEqual(calls[0]?.url.searchParams.get("limit"), "50");
    return data;
  });

  deepStrictEqual(result, response);
});

test("member API wrappers share the authenticated client for league and season", async () => {
  const response = [{ userId: "user-1", userName: "一郎" }];

  const result = await withMockedFetch(response, async (calls) => {
    const leagueMembers = await listStatisticsLeagueMembers("league-1");
    const seasonMembers = await listStatisticsSeasonMembers(
      "league-1",
      "season-1"
    );

    strictEqual(calls.length, 2);
    strictEqual(calls[0]?.url.pathname, "/api/leagues/league-1/members");
    strictEqual(
      calls[1]?.url.pathname,
      "/api/leagues/league-1/seasons/season-1/members"
    );
    return { leagueMembers, seasonMembers };
  });

  deepStrictEqual(result.leagueMembers, response);
  deepStrictEqual(result.seasonMembers, response);
});
