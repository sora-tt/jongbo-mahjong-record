import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";
import { Provider } from "react-redux";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";

import { store } from "@/store";
import {
  clearRecordingFlow,
  setRecordingFlow,
} from "@/store/slices/recording-flow-slice";

import type { MatchYakumanEventInput } from "@/features/match/api";
import type { MatchFormValues } from "@/features/session-match/model/match-form";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  pretendToBeVisual: true,
  url: "http://localhost",
});

Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  Node: { configurable: true, value: dom.window.Node },
  MutationObserver: {
    configurable: true,
    value: dom.window.MutationObserver,
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

type CapturedRequest = {
  method: string;
  pathname: string;
  body: Record<string, unknown> | null;
};

const originalFetch = globalThis.fetch;
const requests: CapturedRequest[] = [];
const members = [
  { userId: "user-1", userName: "一郎" },
  { userId: "user-2", userName: "二郎" },
  { userId: "user-3", userName: "三郎" },
  { userId: "user-4", userName: "四郎" },
];
const yakumanEvents: MatchYakumanEventInput = [
  { winnerUserId: "user-1", kind: "daisangen" },
  { winnerUserId: "user-1", kind: "suuankouTanki" },
];
const basePath = "/api/leagues/league-1/seasons/season-1";
const league = {
  id: "league-1",
  name: "リーグ",
  rule: {
    gameType: "yonma",
    uma: { mode: "fixed", first: 20, second: 10, third: -10, fourth: -20 },
    oka: { startingPoints: 25000, returnPoints: 30000 },
    chomboPenaltyPoints: 4000,
    allowOffTableKyotaku: true,
    rotateSeatOrder: false,
  },
  memberCount: 4,
  totalMatchCount: 0,
  activeSeason: null,
  members,
  leagueRecords: null,
  createdAt: "2026-10-31T00:00:00.000Z",
  updatedAt: "2026-10-31T00:00:00.000Z",
};
const session = {
  id: "session-1",
  leagueId: "league-1",
  seasonId: "season-1",
  tableLabel: null,
  startedAt: "2026-10-31T00:00:00.000Z",
  endedAt: null,
  createdBy: "user-1",
  members,
  createdAt: "2026-10-31T00:00:00.000Z",
  updatedAt: "2026-10-31T00:00:00.000Z",
};
const season = {
  id: "season-1",
  leagueId: "league-1",
  name: "秋季",
  status: "active",
  memberCount: 4,
  totalMatchCount: 0,
  members,
  standings: [],
  pointProgressions: [],
  seasonRecords: null,
  latestPlayedAt: null,
  createdAt: "2026-10-31T00:00:00.000Z",
  updatedAt: "2026-10-31T00:00:00.000Z",
};
const match = {
  id: "match-1",
  leagueId: "league-1",
  seasonId: "season-1",
  sessionId: "session-1",
  playedAt: "2026-10-31T00:00:00.000Z",
  results: [
    { userId: "user-1", wind: "east", rawScore: 25000 },
    { userId: "user-2", wind: "south", rawScore: 25000 },
    { userId: "user-3", wind: "west", rawScore: 25000 },
    { userId: "user-4", wind: "north", rawScore: 25000 },
  ],
  yakumanEvents,
  chomboEvents: [],
  offTableKyotakuCount: 0,
  createdAt: "2026-10-31T00:00:00.000Z",
  updatedAt: "2026-10-31T00:00:00.000Z",
};

const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify({ data }), {
    status,
    headers: { "content-type": "application/json" },
  });

const failureResponse = () =>
  new Response(
    JSON.stringify({
      error: {
        code: "internal_error",
        message: "保存に失敗しました",
        details: {},
      },
    }),
    { status: 500, headers: { "content-type": "application/json" } }
  );

const mockMatchSaveFailure = () => {
  globalThis.fetch = (async (input, init) => {
    const request =
      input instanceof Request ? input.clone() : new Request(input, init);
    const pathname = new URL(request.url).pathname;
    const rawBody = await request.text();
    const method = request.method;
    const body = rawBody
      ? (JSON.parse(rawBody) as Record<string, unknown>)
      : null;
    requests.push({ method, pathname, body });

    if (method === "GET" && pathname === "/api/leagues/league-1") {
      return response(league);
    }
    if (method === "GET" && pathname === `${basePath}/sessions/session-1`) {
      return response(session);
    }
    if (method === "GET" && pathname === basePath) {
      return response(season);
    }
    if (
      method === "GET" &&
      pathname === `${basePath}/sessions/session-1/matches/match-1`
    ) {
      return response(match);
    }
    if (method === "POST" && pathname === `${basePath}/sessions`) {
      return response({ ...session, id: "session-created" }, 201);
    }
    if (
      (method === "POST" && pathname.endsWith("/matches")) ||
      (method === "PATCH" && pathname.endsWith("/matches/match-1"))
    ) {
      return failureResponse();
    }
    if (
      method === "DELETE" &&
      pathname === `${basePath}/sessions/session-created`
    ) {
      return new Response(null, { status: 204 });
    }

    throw new Error(`Unexpected API request: ${method} ${pathname}`);
  }) as typeof fetch;
};

let cleanup!: typeof import("@testing-library/react").cleanup;
let act!: typeof import("@testing-library/react").act;
let renderHook!: typeof import("@testing-library/react").renderHook;
let waitFor!: typeof import("@testing-library/react").waitFor;
let useInitialMatchPage!: typeof import("@/features/match/hooks/use-initial-match").useRecordMatchPage;
let useAdditionalMatchPage!: typeof import("@/features/match/hooks/use-additional-match").useRecordMatchPage;
let useEditMatchPage!: typeof import("@/features/match/hooks/use-edit-match").useEditMatchPage;

const setup = Promise.all([
  import("@testing-library/react"),
  import("@/features/match/hooks/use-initial-match"),
  import("@/features/match/hooks/use-additional-match"),
  import("@/features/match/hooks/use-edit-match"),
]).then(([testingLibrary, initialModule, additionalModule, editModule]) => {
  ({ cleanup, act, renderHook, waitFor } = testingLibrary);
  ({ useRecordMatchPage: useInitialMatchPage } = initialModule);
  ({ useRecordMatchPage: useAdditionalMatchPage } = additionalModule);
  ({ useEditMatchPage } = editModule);
});

const router = {
  back: () => {},
  forward: () => {},
  push: () => {},
  replace: (_href: string) => {},
  refresh: () => {},
  prefetch: async () => {},
};

const createWrapper = (params: Record<string, string>) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AppRouterContext.Provider value={router as never}>
      <PathParamsContext.Provider value={params as never}>
        <Provider store={store}>{children}</Provider>
      </PathParamsContext.Provider>
    </AppRouterContext.Provider>
  );
  return Wrapper;
};

const validValues = (
  values: MatchFormValues,
  events: MatchYakumanEventInput
): MatchFormValues => ({
  ...values,
  rawScoreByWind: { east: "250", south: "250", west: "250", north: "250" },
  yakumanEnabled: events.length > 0,
  yakumanEvents: events.map((event) => ({ ...event })),
});

const findRequest = (method: string, pathSuffix: string) =>
  requests.find(
    (request) =>
      request.method === method && request.pathname.endsWith(pathSuffix)
  );

afterEach(async () => {
  await setup;
  cleanup();
  globalThis.fetch = originalFetch;
  requests.length = 0;
  store.dispatch(clearRecordingFlow());
});

test("initial Match create sends the empty array and retains scores after save failure", async () => {
  await setup;
  mockMatchSaveFailure();
  store.dispatch(
    setRecordingFlow({
      leagueId: "league-1",
      seasonId: "season-1",
      selectedPlayerIds: members.map((member) => member.userId),
      selectedPlayersBySeat: {
        east: "user-1",
        south: "user-2",
        west: "user-3",
        north: "user-4",
      },
      sessionId: null,
    })
  );
  const { result } = renderHook(() => useInitialMatchPage(), {
    wrapper: createWrapper({ leagueId: "league-1", seasonId: "season-1" }),
  });
  await waitFor(() => assert.equal(result.current.isLoading, false));

  const submittedValues = validValues(result.current.values, []);
  act(() => result.current.onValuesChange(submittedValues));
  await act(async () => result.current.handleSubmit());

  assert.deepEqual(
    findRequest("POST", "/sessions/session-created/matches")?.body
      ?.yakumanEvents,
    []
  );
  assert.deepEqual(result.current.values, submittedValues);
  assert.ok(result.current.error);
});

test("additional Match create sends composite yakuman and retains entries after save failure", async () => {
  await setup;
  mockMatchSaveFailure();
  const { result } = renderHook(() => useAdditionalMatchPage(), {
    wrapper: createWrapper({
      leagueId: "league-1",
      seasonId: "season-1",
      sessionId: "session-1",
    }),
  });
  await waitFor(() => assert.equal(result.current.isLoading, false));

  const submittedValues = validValues(result.current.values, yakumanEvents);
  act(() => result.current.onValuesChange(submittedValues));
  await act(async () => result.current.handleSubmit());

  assert.deepEqual(
    findRequest("POST", "/sessions/session-1/matches")?.body?.yakumanEvents,
    yakumanEvents
  );
  assert.deepEqual(result.current.values, submittedValues);
  assert.ok(result.current.error);
});

test("incomplete additional Match yakuman rows are returned for inline validation", async () => {
  await setup;
  mockMatchSaveFailure();
  const { result } = renderHook(() => useAdditionalMatchPage(), {
    wrapper: createWrapper({
      leagueId: "league-1",
      seasonId: "season-1",
      sessionId: "session-1",
    }),
  });
  await waitFor(() => assert.equal(result.current.isLoading, false));

  const values: MatchFormValues = {
    ...validValues(result.current.values, []),
    yakumanEnabled: true,
    yakumanEvents: [{ winnerUserId: null, kind: null }],
  };
  act(() => result.current.onValuesChange(values));
  await act(async () => result.current.handleSubmit());

  assert.deepEqual(result.current.yakumanErrors, [
    { index: 0, message: "和了者と役満種を選択してください" },
  ]);
  assert.equal(findRequest("POST", "/sessions/session-1/matches"), undefined);
});

test("edit Match update sends restored yakuman and retains values after save failure", async () => {
  await setup;
  mockMatchSaveFailure();
  const { result } = renderHook(() => useEditMatchPage(), {
    wrapper: createWrapper({
      leagueId: "league-1",
      seasonId: "season-1",
      sessionId: "session-1",
      matchId: "match-1",
    }),
  });
  await waitFor(() => assert.equal(result.current.isLoading, false));

  const submittedValues = result.current.values;
  assert.ok(submittedValues);
  assert.deepEqual(
    submittedValues.yakumanEvents.map((event) => ({ ...event })),
    yakumanEvents
  );
  await act(async () => result.current.handleSubmit());

  assert.deepEqual(
    findRequest("PATCH", "/sessions/session-1/matches/match-1")?.body
      ?.yakumanEvents,
    yakumanEvents
  );
  assert.deepEqual(result.current.values, submittedValues);
  assert.ok(result.current.error);
});

test("editing off-table records sends the changed values and keeps them on failure", async () => {
  await setup;
  mockMatchSaveFailure();
  const { result } = renderHook(() => useEditMatchPage("/v2"), {
    wrapper: createWrapper({
      leagueId: "league-1",
      seasonId: "season-1",
      sessionId: "session-1",
      matchId: "match-1",
    }),
  });
  await waitFor(() => assert.equal(result.current.isLoading, false));
  const initial = result.current.values;
  assert.ok(initial);
  const changed: MatchFormValues = {
    ...initial,
    chomboOffenderUserIds: ["user-1", "user-2"],
    offTableKyotakuPresent: true,
    offTableKyotakuCount: "1",
    rawScoreByWind: { ...initial.rawScoreByWind, east: "240" },
  };
  act(() => result.current.onValuesChange(changed));
  await act(async () => result.current.handleSubmit());
  const body = findRequest(
    "PATCH",
    "/sessions/session-1/matches/match-1"
  )?.body;
  assert.deepEqual(body?.chomboEvents, [
    { offenderUserId: "user-1" },
    { offenderUserId: "user-2" },
  ]);
  assert.equal(body?.offTableKyotakuCount, 1);
  assert.deepEqual(result.current.values, changed);
  assert.ok(result.current.error);
});

test("v2 initial match retries a failed load without discarding player selection", async () => {
  await setup;
  store.dispatch(
    setRecordingFlow({
      leagueId: "league-1",
      seasonId: "season-1",
      sessionId: null,
      selectedPlayerIds: ["user-1", "user-2", "user-3", "user-4"],
      selectedPlayersBySeat: {
        east: "user-1",
        south: "user-2",
        west: "user-3",
        north: "user-4",
      },
    })
  );
  let leagueAttempts = 0;
  globalThis.fetch = (async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const pathname = new URL(request.url).pathname;
    if (pathname === "/api/leagues/league-1") {
      leagueAttempts += 1;
      return leagueAttempts === 1 ? failureResponse() : response(league);
    }
    if (pathname === basePath) return response(season);
    throw new Error(`Unexpected API request: ${pathname}`);
  }) as typeof fetch;
  const { result } = renderHook(() => useInitialMatchPage("/v2"), {
    wrapper: createWrapper({ leagueId: "league-1", seasonId: "season-1" }),
  });
  await waitFor(() =>
    assert.ok(!result.current.isLoading && result.current.error)
  );
  act(() => result.current.retry());
  await waitFor(() => assert.equal(result.current.members.length, 4));
  assert.equal(result.current.error, null);
  assert.equal(result.current.values.userIdByWind.east, "user-1");
});

test("v2 additional match retries a failed load", async () => {
  await setup;
  let sessionAttempts = 0;
  globalThis.fetch = (async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const pathname = new URL(request.url).pathname;
    if (pathname === "/api/leagues/league-1") return response(league);
    if (pathname === `${basePath}/sessions/session-1`) {
      sessionAttempts += 1;
      return sessionAttempts === 1 ? failureResponse() : response(session);
    }
    throw new Error(`Unexpected API request: ${pathname}`);
  }) as typeof fetch;
  const { result } = renderHook(() => useAdditionalMatchPage("/v2"), {
    wrapper: createWrapper({
      leagueId: "league-1",
      seasonId: "season-1",
      sessionId: "session-1",
    }),
  });
  await waitFor(() =>
    assert.ok(!result.current.isLoading && result.current.error)
  );
  act(() => result.current.retry());
  await waitFor(() => assert.equal(result.current.ready, true));
  assert.equal(result.current.error, null);
});

test("authentication failure keeps v2 recording in the v2 login flow", async () => {
  await setup;
  const redirects: string[] = [];
  const originalReplace = router.replace;
  router.replace = (href: string) => {
    redirects.push(href);
  };
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        error: {
          code: "authentication_error",
          message: "unauthorized",
          details: {},
        },
      }),
      { status: 401, headers: { "content-type": "application/json" } }
    )) as typeof fetch;
  try {
    renderHook(() => useAdditionalMatchPage("/v2"), {
      wrapper: createWrapper({
        leagueId: "league-1",
        seasonId: "season-1",
        sessionId: "session-1",
      }),
    });
    await waitFor(() => assert.ok(redirects.includes("/v2/login")));
  } finally {
    router.replace = originalReplace;
  }
});

test("season edit loads its league name alongside the existing season", async () => {
  await setup;
  const { useSeasonEdit } =
    await import("@/features/season/hooks/use-season-edit");
  globalThis.fetch = (async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const pathname = new URL(request.url).pathname;
    if (pathname === "/api/leagues/league-1") return response(league);
    if (pathname === "/api/leagues/league-1/members") return response(members);
    if (pathname === basePath) return response(season);
    throw new Error(`Unexpected API request: ${pathname}`);
  }) as typeof fetch;
  const { result } = renderHook(() => useSeasonEdit("/v2", true), {
    wrapper: createWrapper({ leagueId: "league-1", seasonId: "season-1" }),
  });
  await waitFor(() => assert.equal(result.current.isLoaded, true));
  assert.equal(result.current.leagueName, "リーグ");
  assert.equal(result.current.seasonName, "秋季");
});
