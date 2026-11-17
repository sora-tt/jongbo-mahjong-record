import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  pretendToBeVisual: true,
  url: "http://localhost",
});

Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  self: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  Node: { configurable: true, value: dom.window.Node },
  MutationObserver: {
    configurable: true,
    value: dom.window.MutationObserver,
  },
  ResizeObserver: {
    configurable: true,
    value: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  },
  getComputedStyle: {
    configurable: true,
    value: dom.window.getComputedStyle.bind(dom.window),
  },
  IS_REACT_ACT_ENVIRONMENT: {
    configurable: true,
    writable: true,
    value: true,
  },
});

let act!: typeof import("@testing-library/react").act;
let cleanup!: typeof import("@testing-library/react").cleanup;
let fireEvent!: typeof import("@testing-library/react").fireEvent;
let render!: typeof import("@testing-library/react").render;
let renderHook!: typeof import("@testing-library/react").renderHook;
let screen!: typeof import("@testing-library/react").screen;
let waitFor!: typeof import("@testing-library/react").waitFor;
let createUseStatistics!: typeof import("./index").createUseStatistics;
let StatisticsPageContent!: typeof import("@/features/statistics/ui/StatisticsPageContent").StatisticsPageContent;
let StatisticsViewTabs!: typeof import("@/features/statistics/ui/StatisticsViewTabs").StatisticsViewTabs;

const setup = Promise.all([
  import("@testing-library/react"),
  import("./index"),
  import("@/features/statistics/ui/StatisticsPageContent"),
  import("@/features/statistics/ui/StatisticsViewTabs"),
]).then(([testingLibrary, hookModule, pageModule, tabsModule]) => {
  ({ act, cleanup, fireEvent, render, renderHook, screen, waitFor } =
    testingLibrary);
  ({ createUseStatistics } = hookModule);
  ({ StatisticsPageContent } = pageModule);
  ({ StatisticsViewTabs } = tabsModule);
});

type HookApi = NonNullable<
  Parameters<typeof import("./index").createUseStatistics>[0]
>;
type StatisticsSummaryRequest = Parameters<
  HookApi["getPersonalStatisticsSummary"]
>[0];

const viewer = { id: "viewer-1", name: "一郎" };
const otherMember = { userId: "member-2", userName: "二郎" };
const readyScope = { scopeType: "overall", gameType: "all" };
const readyGeneratedAt = "2026-10-04T00:00:00.000Z";

const readySummary = {
  status: "ready",
  scope: readyScope,
  generatedAt: readyGeneratedAt,
  timeZone: "Asia/Tokyo",
  totals: {
    totalMatchCount: 12,
    sessionCount: 4,
    totalPoints: 25.5,
    averageFinalPoint: 2.125,
    chomboCount: 0,
  },
  byGameType: [
    {
      gameType: "yonma",
      matchCount: 12,
      totalPoints: 25.5,
      averageFinalPoint: 2.125,
      averageRank: 2.5,
      topRate: 0.25,
      topTwoRate: 0.5,
      topThreeRate: 0.75,
      lastRate: 0.25,
      lastAvoidanceRate: 0.75,
      ranks: [
        { rank: 1, count: 3, rate: 0.25 },
        { rank: 2, count: 3, rate: 0.25 },
        { rank: 3, count: 3, rate: 0.25 },
        { rank: 4, count: 3, rate: 0.25 },
      ],
    },
  ],
  scoreByGameType: [
    {
      gameType: "yonma",
      rawScore: {
        matchCount: 12,
        average: 35_000,
        maximum: 50_000,
        minimum: 18_000,
        median: 34_000,
        populationStandardDeviation: 8_000,
      },
      finalPoint: {
        matchCount: 12,
        average: 2.125,
        maximum: 60,
        minimum: -40,
        median: 3,
        populationStandardDeviation: 18,
        positive: { count: 7, denominator: 12, rate: 7 / 12 },
        negative: { count: 5, denominator: 12, rate: 5 / 12 },
        even: { count: 0, denominator: 12, rate: 0 },
      },
    },
  ],
  scoreByRank: [],
  records: {
    highestRawScore: null,
    lowestRawScore: null,
    highestFinalPoint: null,
    lowestFinalPoint: null,
  },
  streaks: [],
  recentResults: [
    { windowSize: 10, matchCount: 10, totalPoints: 25.5, byGameType: [] },
  ],
  currentStanding: null,
} as never;

const readyAnalysis = {
  status: "ready",
  scope: readyScope,
  generatedAt: readyGeneratedAt,
  timeZone: "Asia/Tokyo",
  windowSize: 10,
  progression: [
    {
      playedAt: "2026-10-01T00:00:00.000Z",
      matchId: "match-1",
      matchIndex: 1,
      gameType: "yonma",
      point: 5,
      cumulativePoint: 5,
    },
    {
      playedAt: "2026-10-02T00:00:00.000Z",
      matchId: "match-2",
      matchIndex: 1,
      gameType: "yonma",
      point: 3,
      cumulativePoint: 8,
    },
    {
      playedAt: "2026-10-03T00:00:00.000Z",
      matchId: "match-3",
      matchIndex: 1,
      gameType: "yonma",
      point: -2,
      cumulativePoint: 6,
    },
    {
      playedAt: "2026-10-04T00:00:00.000Z",
      matchId: "match-4",
      matchIndex: 1,
      gameType: "yonma",
      point: 4,
      cumulativePoint: 10,
    },
  ],
  breakdown: {
    dimension: "period",
    rows: [
      {
        key: "2026-10",
        label: "2026年10月",
        gameType: "yonma",
        matchCount: 4,
        denominator: 4,
        totalPoints: 10,
        averageRank: 2.5,
        topRate: 0.25,
        averageFinalPoint: 2.5,
        rankCounts: [],
      },
    ],
    nextCursor: null,
  },
} as never;

const deferred = <TValue,>() => {
  let resolve!: (value: TValue) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<TValue>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const createMockApi = (overrides: Partial<HookApi> = {}) => {
  const calls: {
    summaries: StatisticsSummaryRequest[];
    analyses: unknown[];
    histories: unknown[];
    leagueMembers: string[];
    seasonMembers: Array<[string, string]>;
  } = {
    summaries: [],
    analyses: [],
    histories: [],
    leagueMembers: [],
    seasonMembers: [],
  };
  const api: HookApi = {
    getCurrentUser: async () => viewer,
    listJoiningSeasons: async () => [],
    getUserStats: async () => ({}) as never,
    getPersonalStatisticsSummary: async (input) => {
      calls.summaries.push(input);
      return { status: "empty" } as never;
    },
    getPersonalStatisticsAnalysis: async (input) => {
      calls.analyses.push(input);
      return { status: "uncomputed" } as never;
    },
    getStatisticsMatchHistory: async (input) => {
      calls.histories.push(input);
      return { status: "empty", items: [], nextCursor: null } as never;
    },
    listStatisticsLeagueMembers: async (leagueId) => {
      calls.leagueMembers.push(leagueId);
      return [
        { userId: viewer.id, userName: viewer.name },
        otherMember,
      ] as never;
    },
    listStatisticsSeasonMembers: async (leagueId, seasonId) => {
      calls.seasonMembers.push([leagueId, seasonId]);
      return [{ userId: viewer.id, userName: viewer.name }] as never;
    },
    ...overrides,
  } as HookApi;
  const router = { replace: () => undefined };
  const useRouter = () => router as never;

  return { api, calls, useRouter };
};

const createHook = (
  api: HookApi,
  useRouter: () => never,
  search = `?scopeType=overall&targetUserId=${viewer.id}`
) => {
  dom.reconfigure({
    url: `http://localhost/stats${search}`,
  });
  const useSearchParams = () => new URLSearchParams(window.location.search);
  return createUseStatistics(api, useRouter as never, useSearchParams as never);
};

afterEach(async () => {
  await setup;
  cleanup();
});

test("hook loads summary first and fetches analysis/history only when selected", async () => {
  await setup;
  const { api, calls, useRouter } = createMockApi();
  const useStatistics = createHook(api, useRouter);
  const { result } = renderHook(() => useStatistics());

  await waitFor(() => {
    assert.equal(result.current.summaryStatus, "empty");
  });
  assert.equal(calls.summaries.length, 1);
  assert.equal(calls.analyses.length, 0);
  assert.equal(calls.histories.length, 0);

  act(() => result.current.onChangeActiveView("trend"));
  await waitFor(() => {
    assert.equal(result.current.analysisStatus, "uncomputed");
  });
  assert.equal(calls.analyses.length, 1);
  assert.equal(calls.histories.length, 0);

  act(() => result.current.onChangeActiveView("history"));
  await waitFor(() => {
    assert.equal(result.current.historyStatus, "empty");
  });
  assert.equal(calls.histories.length, 1);

  act(() => result.current.onChangeActiveView("trend"));
  await waitFor(() => {
    assert.equal(result.current.analysisStatus, "uncomputed");
  });
  assert.equal(calls.analyses.length, 1);
});

test("hook caches scope rosters, keeps filters on target change and discards a stale summary", async () => {
  await setup;
  const initialSummary = deferred<unknown>();
  const { api: baseApi, calls, useRouter } = createMockApi();
  const api: HookApi = {
    ...baseApi,
    getPersonalStatisticsSummary: async (input) => {
      calls.summaries.push(input);
      return calls.summaries.length === 1
        ? (initialSummary.promise as never)
        : ({ status: "empty" } as never);
    },
  };
  const useStatistics = createHook(api, useRouter);
  const { result } = renderHook(() => useStatistics());

  await waitFor(() => {
    assert.equal(result.current.viewerUserId, viewer.id);
    assert.equal(calls.summaries.length, 1);
  });

  act(() => {
    result.current.onChangeDateRange("2026-09-01", "2026-09-30");
    result.current.onChangeGameType("sanma");
    result.current.onChangeScope({
      scopeType: "league",
      leagueId: "league-1",
      gameType: "sanma",
      from: "2026-09-01",
      to: "2026-09-30",
    });
  });

  await waitFor(() => {
    assert.equal(result.current.membersStatus, "ready");
  });
  assert.deepEqual(calls.leagueMembers, ["league-1"]);

  act(() => result.current.onChangeTarget(otherMember.userId));
  await waitFor(() => {
    assert.equal(result.current.targetUserId, otherMember.userId);
    assert.equal(result.current.summaryStatus, "empty");
  });
  assert.deepEqual(calls.summaries.at(-1)?.query, {
    scopeType: "league",
    leagueId: "league-1",
    from: "2026-09-01",
    to: "2026-09-30",
    gameType: "sanma",
  });

  await act(async () => {
    initialSummary.resolve({ status: "empty" });
    await initialSummary.promise;
  });
  assert.equal(result.current.targetUserId, otherMember.userId);
  assert.equal(result.current.summary?.targetUserId, otherMember.userId);

  act(() => {
    result.current.onChangeScope({ scopeType: "overall", gameType: "all" });
  });
  act(() => {
    result.current.onChangeScope({
      scopeType: "league",
      leagueId: "league-1",
      gameType: "sanma",
      from: "2026-09-01",
      to: "2026-09-30",
    });
  });
  await waitFor(() => {
    assert.equal(result.current.membersStatus, "ready");
  });
  assert.equal(calls.leagueMembers.length, 1);
});

test("hook falls back to self on roster failure, retries, and resets a target outside the next scope", async () => {
  await setup;
  let leagueMemberAttempt = 0;
  const {
    api: baseApi,
    calls,
    useRouter,
  } = createMockApi({
    listStatisticsLeagueMembers: async (leagueId) => {
      calls.leagueMembers.push(leagueId);
      leagueMemberAttempt += 1;
      if (leagueMemberAttempt === 1) throw new Error("roster failed");
      return [
        { userId: viewer.id, userName: viewer.name },
        otherMember,
      ] as never;
    },
    listStatisticsSeasonMembers: async (leagueId, seasonId) => {
      calls.seasonMembers.push([leagueId, seasonId]);
      return [{ userId: viewer.id, userName: viewer.name }] as never;
    },
  });
  const useStatistics = createHook(baseApi, useRouter);
  const { result } = renderHook(() => useStatistics());

  await waitFor(() => assert.equal(result.current.viewerUserId, viewer.id));
  act(() => {
    result.current.onChangeScope({
      scopeType: "league",
      leagueId: "league-1",
      gameType: "all",
    });
  });
  await waitFor(() => {
    assert.equal(result.current.membersStatus, "error");
    assert.ok(result.current.membersError);
  });
  assert.equal(result.current.targetUserId, viewer.id);

  act(() => result.current.retryMembers());
  await waitFor(() => assert.equal(result.current.membersStatus, "ready"));
  assert.equal(calls.leagueMembers.length, 2);

  act(() => result.current.onChangeTarget(otherMember.userId));
  await waitFor(() =>
    assert.equal(result.current.targetUserId, otherMember.userId)
  );
  act(() => {
    result.current.onChangeScope({
      scopeType: "season",
      leagueId: "league-1",
      seasonId: "season-1",
      gameType: "all",
    });
  });
  await waitFor(() => {
    assert.deepEqual(calls.seasonMembers, [["league-1", "season-1"]]);
    assert.equal(result.current.membersStatus, "ready");
    assert.equal(result.current.targetUserId, viewer.id);
  });
});

test("ready statistics page announces metric values and exposes chart data in a table", async () => {
  await setup;
  const { api: baseApi, calls, useRouter } = createMockApi();
  const api: HookApi = {
    ...baseApi,
    getPersonalStatisticsSummary: async (input) => {
      calls.summaries.push(input);
      return readySummary;
    },
    getPersonalStatisticsAnalysis: async (input) => {
      calls.analyses.push(input);
      if (input.query.dimension === "period") return readyAnalysis;
      return {
        ...(readyAnalysis as object),
        breakdown: {
          dimension: input.query.dimension,
          rows: [
            {
              key: "mon",
              label: input.query.dimension === "weekday" ? "月曜日" : "00–05時",
              gameType: "yonma",
              matchCount: 4,
              denominator: 4,
              totalPoints: 10,
              averageRank: 2.5,
              topRate: 0.25,
              averageFinalPoint: 2.5,
              rankCounts: [],
            },
          ],
          nextCursor: null,
        },
      } as never;
    },
  };
  const useStatistics = createHook(api, useRouter);
  const PageHarness: React.FC = () => (
    <StatisticsPageContent
      useStatisticsHook={useStatistics}
      includeAppShell={false}
    />
  );
  const { container } = render(<PageHarness />);

  await waitFor(() => {
    assert.ok(screen.getByRole("heading", { name: "総合" }));
  });
  assert.ok(screen.getByText("全12対局の合計ポイント"));
  assert.ok(screen.getByText("総合ポイント"));
  assert.ok(screen.getByText("平均順位"));
  assert.ok(screen.getByText("2.50"));
  assert.ok(screen.getByText("+25.50"));
  assert.ok(container.querySelector(".max-w-md.px-4"));

  fireEvent.keyDown(screen.getByRole("tab", { name: "総合" }), {
    key: "ArrowRight",
  });
  await waitFor(() => {
    assert.ok(screen.getByRole("heading", { name: "成績推移" }));
  });
  assert.equal(calls.analyses.length, 1);
  assert.ok(
    screen.getByRole("img", {
      name: /月別の総合ポイントを示す棒グラフ/,
    })
  );
  const monthlyTable = screen.getByRole("table", {
    name: /月ごとの対局数、総合ポイント/,
  });
  assert.ok(monthlyTable.textContent?.includes("+10 pt"));
});

test("statistics tabs expose selected panel and move focus with arrow keys", async () => {
  await setup;
  const Harness: React.FC = () => {
    const [activeView, setActiveView] = React.useState<
      "overview" | "trend" | "comparisons" | "history"
    >("overview");
    return (
      <StatisticsViewTabs
        activeView={activeView}
        onActiveViewChange={setActiveView}
        panels={{
          overview: <p>平均順位 2.50位</p>,
          trend: <p>月別累計ポイント 25.0 pt</p>,
          comparisons: <p>席・相手別成績</p>,
          history: <p>対局履歴: 20件</p>,
        }}
      />
    );
  };
  render(<Harness />);

  const overviewTab = screen.getByRole("tab", { name: "総合" });
  const trendTab = screen.getByRole("tab", { name: "推移" });
  assert.equal(overviewTab.getAttribute("aria-selected"), "true");
  assert.equal(trendTab.getAttribute("aria-selected"), "false");
  assert.equal(
    screen.getByRole("tablist").getAttribute("aria-label"),
    "成績表示"
  );

  fireEvent.keyDown(overviewTab, { key: "ArrowRight" });
  assert.equal(trendTab.getAttribute("aria-selected"), "true");
  assert.equal(document.activeElement, trendTab);
  assert.equal(
    screen.getByRole("tabpanel").textContent,
    "月別累計ポイント 25.0 pt"
  );
});

test("v2 statistics uses v2 routes and switches views without changing API behavior", async () => {
  await setup;
  const { StatisticsPageContent: V2PageContent } =
    await import("@/features/statistics/ui/v2/page-content");
  const base = readySummary as unknown as {
    scoreByGameType: Array<{ rawScore: unknown; finalPoint: unknown }>;
  };
  const { api, calls } = createMockApi({
    getPersonalStatisticsSummary: async (input) => {
      calls.summaries.push(input);
      return {
        ...(readySummary as object),
        rawScore: base.scoreByGameType[0].rawScore,
        finalPoint: base.scoreByGameType[0].finalPoint,
      } as never;
    },
    getPersonalStatisticsAnalysis: async (input) => {
      calls.analyses.push(input);
      return readyAnalysis;
    },
  });
  const routes: string[] = [];
  const router = {
    replace: (href: string) => {
      routes.push(href);
    },
  };
  const useRouter = () => router as never;
  const useStatistics = createHook(
    api,
    useRouter,
    "?scopeType=league&leagueId=league-1"
  );
  render(
    <V2PageContent useStatisticsHook={useStatistics} includeAppShell={false} />
  );
  await waitFor(() => assert.ok(screen.getByText("総合ポイント")));
  assert.ok(screen.getByText("+25.5"));
  assert.equal(calls.summaries.length, 1);
  assert.equal(calls.summaries[0].query.includePointBreakdown, "true");
  assert.equal(calls.summaries[0].query.includeYakumanCounts, "true");
  fireEvent.keyDown(screen.getByRole("tab", { name: "総合" }), {
    key: "ArrowRight",
  });
  await waitFor(() =>
    assert.ok(screen.getByRole("heading", { name: "月別の成績" }))
  );
  assert.equal(
    document.activeElement,
    screen.getByRole("tab", { name: "推移" })
  );
  assert.ok(
    routes.some(
      (href) => href.startsWith("/v2/stats?") && href.includes("view=trend")
    )
  );
  assert.equal(calls.analyses.length, 1);
});

test("v2 全リーグは順位中心の画面を表示し、古い推移 URL でも分析を取得しない", async () => {
  await setup;
  const { StatisticsPageContent: V2PageContent } =
    await import("@/features/statistics/ui/v2/page-content");
  const { api, calls } = createMockApi({
    getPersonalStatisticsSummary: async (input) => {
      calls.summaries.push(input);
      const source = readySummary as unknown as {
        byGameType: Array<Record<string, unknown>>;
        totals: Record<string, unknown>;
      };
      if (input.query.gameType === "sanma") {
        return {
          ...(readySummary as object),
          totals: { ...source.totals, totalMatchCount: 7 },
          byGameType: [
            {
              ...source.byGameType[0],
              gameType: "sanma",
              matchCount: 7,
              ranks: [
                { rank: 1, count: 3, rate: 3 / 7 },
                { rank: 2, count: 2, rate: 2 / 7 },
                { rank: 3, count: 2, rate: 2 / 7 },
              ],
            },
          ],
          yakumanCounts: [],
        } as never;
      }
      return { ...(readySummary as object), yakumanCounts: [] } as never;
    },
  });
  const routes: string[] = [];
  const router = { replace: (href: string) => routes.push(href) };
  const useRouter = () => router as never;
  const useStatistics = createHook(
    api,
    useRouter,
    "?scopeType=overall&gameType=yonma&view=trend"
  );
  render(
    <V2PageContent useStatisticsHook={useStatistics} includeAppShell={false} />
  );
  await waitFor(() => assert.ok(screen.getByText("12 対局")));
  assert.ok(screen.getByRole("heading", { name: "成績", level: 1 }));
  assert.ok(screen.getByText("四麻・全期間"));
  assert.equal(screen.queryByRole("link", { name: "成績に戻る" }), null);
  assert.equal(screen.queryByRole("tablist"), null);
  assert.equal(screen.queryByText("総合ポイント"), null);
  assert.equal(calls.analyses.length, 0);
  assert.equal(calls.summaries[0].query.gameType, "yonma");
  assert.equal(calls.summaries[0].query.includePointBreakdown, undefined);
  assert.equal(calls.summaries[0].query.includeYakumanCounts, "true");
  assert.equal(
    screen.getByRole("button", { name: "四麻" }).getAttribute("aria-pressed"),
    "true"
  );
  const indicator = screen
    .getByRole("group", { name: "対局形式" })
    .querySelector<HTMLElement>('[aria-hidden="true"]');
  assert.ok(indicator);
  assert.match(indicator.style.transform, /0%/);
  assert.match(indicator.className, /motion-reduce:transition-none/);
  fireEvent.click(screen.getByRole("button", { name: "三麻" }));
  await waitFor(() => assert.ok(screen.getByText("7 対局")));
  assert.ok(screen.getByText("三麻・全期間"));
  assert.equal(
    screen.getByRole("button", { name: "三麻" }).getAttribute("aria-pressed"),
    "true"
  );
  assert.match(indicator.style.transform, /100%/);
  assert.equal(screen.queryByText("4位"), null);
  assert.equal(calls.summaries[1].query.gameType, "sanma");
  const params = new URLSearchParams(routes.at(-1)?.split("?")[1]);
  assert.equal(params.get("gameType"), "sanma");
  assert.equal(params.get("scopeLabel"), "全リーグ・全期間（三麻）");
  fireEvent.click(screen.getByRole("button", { name: "四麻" }));
  await waitFor(() => assert.ok(screen.getByText("12 対局")));
  assert.equal(calls.summaries.length, 2);
});

test("v2 全リーグの対局種別未指定 URL は三麻と四麻の選択を表示する", async () => {
  await setup;
  const { StatisticsPageContent: V2PageContent } =
    await import("@/features/statistics/ui/v2/page-content");
  const { api, useRouter } = createMockApi();
  const useStatistics = createHook(api, useRouter);
  render(
    <V2PageContent useStatisticsHook={useStatistics} includeAppShell={false} />
  );
  await waitFor(() =>
    assert.ok(screen.getByRole("link", { name: "三麻の成績" }))
  );
  assert.match(
    screen.getByRole("link", { name: "三麻の成績" }).getAttribute("href") ?? "",
    /gameType=sanma/
  );
  assert.match(
    screen.getByRole("link", { name: "四麻の成績" }).getAttribute("href") ?? "",
    /gameType=yonma/
  );
});

test("v2 overview groups point breakdown, rank percentages, and streaks", async () => {
  await setup;
  const { StatisticsOverview } =
    await import("@/features/statistics/ui/v2/overview");
  const base = readySummary as unknown as {
    byGameType: Array<Record<string, unknown>>;
    scoreByGameType: Array<{ rawScore: unknown; finalPoint: unknown }>;
  };
  const yonma = base.byGameType[0];
  const summary = {
    ...(readySummary as object),
    pointBreakdown: { rawPoint: 5.5, rankPoint: 25, chomboPenalty: -5 },
    rawScore: base.scoreByGameType[0].rawScore,
    finalPoint: base.scoreByGameType[0].finalPoint,
    byGameType: [
      {
        ...yonma,
        gameType: "sanma",
        matchCount: 4,
        totalPoints: 10,
        ranks: [
          { rank: 1, count: 2, rate: 0.5 },
          { rank: 2, count: 1, rate: 0.25 },
          { rank: 3, count: 1, rate: 0.25 },
        ],
      },
      { ...yonma, totalPoints: 15.5 },
    ],
  };
  const { container } = render(
    <StatisticsOverview
      summary={summary as never}
      startingPoints={null}
      startingPointsByLeagueId={{}}
    />
  );
  assert.ok(screen.getByText("+25.5"));
  assert.ok(screen.getByText("+5.5 pt"));
  assert.ok(screen.getByText("+25 pt"));
  assert.ok(screen.getByText("-5 pt"));
  assert.equal(
    container.querySelector<HTMLElement>("li span span[style]")?.style.width,
    "50%"
  );
  assert.ok(screen.getByText("素点由来"));
  assert.ok(screen.getByText("順位点・オカ"));
  assert.ok(screen.getByText("連続記録"));
  assert.equal(screen.getAllByText("ラス回避率").length, 2);
  assert.equal(screen.queryByText("最多役満"), null);
});

test("v2 score analysis shows the result distribution and rank table", async () => {
  await setup;
  const { ScoreBreakdown } =
    await import("@/features/statistics/ui/v2/score-breakdown");
  render(<ScoreBreakdown summary={readySummary} />);
  assert.ok(screen.getByRole("heading", { name: "スコア分析" }));
  assert.ok(screen.getByText("プラス・マイナス"));
  assert.ok(screen.getByText("順位別スコア"));
  assert.ok(screen.getByText("7回"));
});

test("v2 score analysis shows a dash for missing values but preserves zero", async () => {
  const [{ within }] = await Promise.all([
    import("@testing-library/react"),
    setup,
  ]);
  const { ScoreBreakdown } =
    await import("@/features/statistics/ui/v2/score-breakdown");
  const base = readySummary as unknown as {
    scoreByGameType: Array<{
      gameType: string;
      rawScore: object;
      finalPoint: object;
    }>;
  };
  const format = base.scoreByGameType[0];
  const summary = {
    ...(readySummary as object),
    scoreByGameType: [
      {
        ...format,
        finalPoint: {
          ...format.finalPoint,
          positive: { count: 0, denominator: 0, rate: null },
          negative: { count: 0, denominator: 1, rate: 0 },
          even: { count: 1, denominator: 1, rate: 1 },
        },
      },
    ],
    scoreByRank: [
      {
        gameType: "yonma",
        rank: 1,
        matchCount: 0,
        averageRawScore: null,
        averageFinalPoint: null,
      },
      {
        gameType: "yonma",
        rank: 2,
        matchCount: 1,
        averageRawScore: 0,
        averageFinalPoint: 0,
      },
    ],
  };
  render(<ScoreBreakdown summary={summary as never} />);
  const missingRank = screen.getByRole("row", { name: /1位/ });
  assert.equal(within(missingRank).getAllByText("—").length, 2);
  assert.ok(
    screen.getByRole("row", { name: /2位/ }).textContent?.includes("0 点")
  );
  assert.ok(within(screen.getByRole("row", { name: /プラス/ })).getByText("—"));
  assert.ok(
    within(screen.getByRole("row", { name: /マイナス/ })).getByText("0.0%")
  );
  assert.equal(screen.queryByText(/未算出/), null);
});

test("v2 overview shows a dash without a unit for an unavailable average rank", async () => {
  await setup;
  const { StatisticsOverview } =
    await import("@/features/statistics/ui/v2/overview");
  const base = readySummary as unknown as {
    byGameType: Array<Record<string, unknown>>;
  };
  render(
    <StatisticsOverview
      summary={
        {
          ...(readySummary as object),
          byGameType: [
            { ...base.byGameType[0], averageRank: null, topRate: 0 },
          ],
        } as never
      }
      startingPoints={null}
      startingPointsByLeagueId={{}}
    />
  );
  const average = screen.getByText("平均順位").parentElement;
  assert.equal(average?.textContent, "平均順位—");
  assert.ok(screen.getByText("0.0%"));
});
