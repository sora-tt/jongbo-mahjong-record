import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";
import { Provider } from "react-redux";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";

import { store } from "@/store";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
});
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  Node: { configurable: true, value: dom.window.Node },
  MutationObserver: { configurable: true, value: dom.window.MutationObserver },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: true },
});

const setup = Promise.all([
  import("@testing-library/react"),
  import("./index"),
]);
const originalFetch = globalThis.fetch;
const session = {
  id: "session-1",
  leagueId: "league-1",
  seasonId: "season-1",
  startedAt: "2026-10-31T00:00:00.000Z",
  endedAt: "2026-10-31T12:00:00.000Z",
  createdAt: "2026-10-31T00:00:00.000Z",
  updatedAt: "2026-10-31T12:00:00.000Z",
  createdBy: "user-1",
  members: [],
  memberCount: 0,
  totalMatchCount: 0,
  tableLabel: null,
};
const router = {
  back() {},
  forward() {},
  push() {},
  replace() {},
  refresh() {},
  prefetch: async () => {},
};
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppRouterContext.Provider value={router as never}>
    <PathParamsContext.Provider
      value={{
        leagueId: "league-1",
        seasonId: "season-1",
        sessionId: "session-1",
      }}
    >
      <Provider store={store}>{children}</Provider>
    </PathParamsContext.Provider>
  </AppRouterContext.Provider>
);
afterEach(async () => {
  const [testing] = await setup;
  testing.cleanup();
  globalThis.fetch = originalFetch;
});

test("終了済みセッションを再開し、失敗した場合は終了状態を保って再試行できる", async () => {
  const [{ renderHook, waitFor, act }, { useSessionResultsPage }] = await setup;
  const patches: unknown[] = [];
  let fail = true;
  globalThis.fetch = (async (input, init) => {
    const req =
      input instanceof Request ? input.clone() : new Request(input, init);
    if (req.method === "PATCH") {
      patches.push(await req.json());
      if (fail)
        return new Response(
          JSON.stringify({
            error: {
              code: "internal_error",
              message: "再開できません",
              details: {},
            },
          }),
          { status: 500, headers: { "content-type": "application/json" } }
        );
      return Response.json({ data: { ...session, endedAt: null } });
    }
    return Response.json({
      data: new URL(req.url).pathname.endsWith("/matches") ? [] : session,
    });
  }) as typeof fetch;

  const { result } = renderHook(() => useSessionResultsPage("/v2"), {
    wrapper: Wrapper,
  });
  await waitFor(() => assert.equal(result.current.isLoading, false));
  assert.equal(result.current.isEnded, true);
  await act(async () => result.current.handleResumeRecord());
  assert.equal(result.current.isEnded, true);
  assert.ok(result.current.resumeError);
  fail = false;
  await act(async () => result.current.handleResumeRecord());
  assert.equal(result.current.isEnded, false);
  assert.equal(result.current.resumeError, null);
  assert.deepEqual(patches, [{ endedAt: null }, { endedAt: null }]);
});
