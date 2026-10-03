import { deepStrictEqual, notStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import {
  createHistoryLoadingLifecycle,
  createStatisticsQueryCache,
  createStatisticsQueryKey,
  createStatisticsScopeKey,
  canLoadStatisticsTarget,
  resolveStatisticsMembersFailure,
  selectStatisticsScope,
  selectStatisticsTarget,
  isCurrentStatisticsRequest,
  type StatisticsSelection,
} from "./query-cache";

const selection: StatisticsSelection = {
  viewerUserId: "viewer-1",
  targetUserId: "target-1",
  scope: {
    scopeType: "season",
    leagueId: "league-1",
    seasonId: "season-1",
    from: "2026-01-01T00:00:00.000Z",
    to: "2026-02-01T00:00:00.000Z",
    gameType: "sanma",
  },
  activeView: "analysis",
  dimension: "period",
  groupBy: "month",
  windowSize: 20,
  historyCursor: "opaque-cursor",
};

test("statistics query keys include identity, scope, date, and game type", () => {
  const key = createStatisticsQueryKey({ ...selection, view: "summary" });

  strictEqual(key, createStatisticsQueryKey({ ...selection, view: "summary" }));
  for (const changed of [
    { ...selection, viewerUserId: "viewer-2" },
    { ...selection, targetUserId: "target-2" },
    { ...selection, scope: { ...selection.scope, leagueId: "league-2" } },
    { ...selection, scope: { ...selection.scope, seasonId: "season-2" } },
    {
      ...selection,
      scope: { ...selection.scope, from: "2026-01-02T00:00:00.000Z" },
    },
    {
      ...selection,
      scope: { ...selection.scope, to: "2026-02-02T00:00:00.000Z" },
    },
    { ...selection, scope: { ...selection.scope, gameType: "yonma" as const } },
  ]) {
    notStrictEqual(
      key,
      createStatisticsQueryKey({ ...changed, view: "summary" })
    );
  }
});

test("analysis and history query keys include their paging and view conditions", () => {
  const base = createStatisticsQueryKey({ ...selection, view: "analysis" });

  notStrictEqual(
    base,
    createStatisticsQueryKey({
      ...selection,
      view: "analysis",
      dimension: "weekday",
    })
  );
  notStrictEqual(
    base,
    createStatisticsQueryKey({
      ...selection,
      view: "analysis",
      windowSize: 50,
    })
  );
  notStrictEqual(
    base,
    createStatisticsQueryKey({
      ...selection,
      view: "analysis",
      groupBy: "year",
    })
  );
  notStrictEqual(
    createStatisticsQueryKey({ ...selection, view: "history" }),
    createStatisticsQueryKey({
      ...selection,
      view: "history",
      historyCursor: "next-cursor",
    })
  );
  strictEqual(
    createStatisticsQueryKey({ ...selection, view: "history", cursor: null }),
    createStatisticsQueryKey({
      ...selection,
      view: "history",
      cursor: null,
      historyCursor: "next-cursor",
    })
  );
});

test("target changes retain selected filters and view while resetting history cursor", () => {
  const next = selectStatisticsTarget(selection, "target-2");

  strictEqual(next.targetUserId, "target-2");
  strictEqual(next.scope, selection.scope);
  strictEqual(next.activeView, selection.activeView);
  strictEqual(next.dimension, selection.dimension);
  strictEqual(next.groupBy, selection.groupBy);
  strictEqual(next.windowSize, selection.windowSize);
  strictEqual(next.historyCursor, null);
});

test("scope changes retain a target only when it belongs to the new scope", () => {
  const inScope = selectStatisticsScope(
    selection,
    { scopeType: "league", leagueId: "league-1", gameType: "sanma" },
    ["viewer-1", "target-1"]
  );
  const outOfScope = selectStatisticsScope(
    selection,
    { scopeType: "league", leagueId: "league-2", gameType: "sanma" },
    ["viewer-1", "target-3"]
  );

  strictEqual(inScope.targetUserId, "target-1");
  strictEqual(inScope.scope.scopeType, "league");
  strictEqual(outOfScope.targetUserId, "viewer-1");
  strictEqual(outOfScope.historyCursor, null);
});

test("unknown scope membership retains the target until the roster resolves", () => {
  const nextScope = {
    scopeType: "league" as const,
    leagueId: "league-2",
    gameType: "sanma" as const,
  };
  const pending = selectStatisticsScope(selection, nextScope, null);
  const confirmedMember = selectStatisticsScope(pending, nextScope, [
    "viewer-1",
    "target-1",
  ]);
  const confirmedNonMember = selectStatisticsScope(pending, nextScope, [
    "viewer-1",
    "target-3",
  ]);

  strictEqual(pending.targetUserId, "target-1");
  strictEqual(confirmedMember.targetUserId, "target-1");
  strictEqual(confirmedNonMember.targetUserId, "viewer-1");
});

test("uncached non-viewer scope waits for membership before loading summary", () => {
  const nextScope = {
    scopeType: "league" as const,
    leagueId: "league-2",
    gameType: "sanma" as const,
  };
  const pending = selectStatisticsScope(selection, nextScope, null);

  strictEqual(pending.targetUserId, "target-1");
  strictEqual(
    canLoadStatisticsTarget(pending, createStatisticsScopeKey(nextScope), {
      scopeKey: createStatisticsScopeKey(nextScope),
      status: "loading",
      memberUserIds: [],
    }),
    false
  );
  strictEqual(
    canLoadStatisticsTarget(pending, createStatisticsScopeKey(nextScope), {
      scopeKey: createStatisticsScopeKey(nextScope),
      status: "ready",
      memberUserIds: ["viewer-1", "target-1"],
    }),
    true
  );
  strictEqual(
    canLoadStatisticsTarget(pending, createStatisticsScopeKey(nextScope), {
      scopeKey: "previous-scope-key",
      status: "ready",
      memberUserIds: ["viewer-1", "target-1"],
    }),
    false
  );
});

test("membership failure falls back to the viewer and leaves the roster retryable", () => {
  const nextScope = {
    scopeType: "league" as const,
    leagueId: "league-2",
    gameType: "sanma" as const,
  };
  const pending = selectStatisticsScope(selection, nextScope, null);
  const failure = resolveStatisticsMembersFailure(pending);
  const canReadViewerSummary = canLoadStatisticsTarget(
    failure.selection,
    createStatisticsScopeKey(nextScope),
    {
      scopeKey: createStatisticsScopeKey(nextScope),
      status: failure.rosterStatus,
      memberUserIds: [],
    }
  );
  const summaryKey = createStatisticsQueryKey({
    ...failure.selection,
    view: "summary",
  });

  strictEqual(failure.rosterStatus, "error");
  strictEqual(failure.selection.targetUserId, "viewer-1");
  strictEqual(canReadViewerSummary, true);
  strictEqual(JSON.parse(summaryKey)[2], "viewer-1");
});

test("cancelling an old history load allows a new load and ignores old completion", () => {
  const lifecycle = createHistoryLoadingLifecycle();
  const previousLoad = lifecycle.start();

  strictEqual(lifecycle.isLoading(), true);
  strictEqual(lifecycle.cancel(previousLoad), true);
  strictEqual(lifecycle.isLoading(), false);

  const nextLoad = lifecycle.start();
  strictEqual(lifecycle.isLoading(), true);
  strictEqual(lifecycle.finish(previousLoad), false);
  strictEqual(lifecycle.isLoading(), true);
  strictEqual(lifecycle.finish(nextLoad), true);
  strictEqual(lifecycle.isLoading(), false);
});

test("overall scope always keeps the authenticated viewer as the target", () => {
  const overallSelection: StatisticsSelection = {
    ...selection,
    targetUserId: "viewer-1",
    scope: { scopeType: "overall", gameType: "all" },
  };

  strictEqual(
    selectStatisticsTarget(overallSelection, "other-user").targetUserId,
    "viewer-1"
  );
});

test("responses from inactive or superseded query keys are rejected", () => {
  strictEqual(isCurrentStatisticsRequest("current", "current", true), true);
  strictEqual(isCurrentStatisticsRequest("old", "current", true), false);
  strictEqual(isCurrentStatisticsRequest("current", "current", false), false);
});

test("query cache reuses successful requests and coalesces concurrent requests", async () => {
  const cache = createStatisticsQueryCache();
  let calls = 0;
  const load = async () => {
    calls += 1;
    return { result: calls };
  };

  const [first, concurrent] = await Promise.all([
    cache.fetch("summary-key", load),
    cache.fetch("summary-key", load),
  ]);
  const revisited = await cache.fetch("summary-key", load);

  strictEqual(calls, 1);
  deepStrictEqual(first, { result: 1 });
  strictEqual(concurrent, first);
  strictEqual(revisited, first);
});

test("query cache can replace a cached page with its accumulated result", async () => {
  const cache = createStatisticsQueryCache();
  cache.set("history-key", { items: ["first", "second"] });

  const cached = await cache.fetch("history-key", async () => ({ items: [] }));

  deepStrictEqual(cached, { items: ["first", "second"] });
});

test("scope membership cache retries failures and caches successful options", async () => {
  const cache = createStatisticsQueryCache();
  let calls = 0;
  const load = async () => {
    calls += 1;
    if (calls === 1) throw new Error("roster unavailable");
    return [{ userId: "viewer-1", userName: "本人" }];
  };

  await cache.fetchMembers("season:league-1:season-1", load).catch(() => null);
  const members = await cache.fetchMembers("season:league-1:season-1", load);
  const cached = await cache.fetchMembers("season:league-1:season-1", load);

  strictEqual(calls, 2);
  strictEqual(members, cached);
  deepStrictEqual(members, [{ userId: "viewer-1", userName: "本人" }]);
});
