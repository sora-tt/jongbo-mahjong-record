import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";
import { Provider } from "react-redux";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";

import { V2ProfileNameProvider } from "@/providers/v2-profile-name-provider";
import { store } from "@/store";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  pretendToBeVisual: true,
  url: "http://localhost",
});
Object.defineProperties(globalThis, {
  React: { configurable: true, value: React },
  window: { configurable: true, value: dom.window },
  self: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  Node: { configurable: true, value: dom.window.Node },
  MutationObserver: { configurable: true, value: dom.window.MutationObserver },
  getComputedStyle: {
    configurable: true,
    value: dom.window.getComputedStyle.bind(dom.window),
  },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: true },
});
dom.window.HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
dom.window.HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
  this.dispatchEvent(new dom.window.Event("close"));
};

const setup = Promise.all([import("@testing-library/react"), import("./page")]);
const originalFetch = globalThis.fetch;
const session = {
  id: "session-1",
  leagueId: "league-1",
  seasonId: "season-1",
  startedAt: "2026-10-31T00:00:00.000Z",
  endedAt: null,
  createdAt: "2026-10-31T00:00:00.000Z",
  updatedAt: "2026-10-31T00:00:00.000Z",
  createdBy: "user-1",
  members: [
    { userId: "user-1", userName: "太郎" },
    { userId: "user-2", userName: "花子" },
  ],
  memberCount: 2,
  totalMatchCount: 2,
  tableLabel: null,
};

afterEach(async () => {
  (await setup)[0].cleanup();
  globalThis.fetch = originalFetch;
});

test("記録再開後のみ削除を表示し、確認したセッションを削除して戻る", async () => {
  const [{ render, screen, fireEvent, within, waitFor }, { default: Page }] =
    await setup;
  const requests: string[] = [];
  const navigations: string[] = [];
  let ended = true;
  const router = {
    back() {},
    forward() {},
    push() {},
    replace(path: string) {
      navigations.push(path);
    },
    refresh() {},
    prefetch: async () => {},
  };
  globalThis.fetch = (async (input, init) => {
    const req =
      input instanceof Request ? input.clone() : new Request(input, init);
    if (req.method === "DELETE") {
      requests.push(new URL(req.url).pathname);
      return new Response(null, { status: 204 });
    }
    if (req.method === "PATCH") {
      ended = false;
      return Response.json({ data: session });
    }
    return Response.json({
      data: new URL(req.url).pathname.endsWith("/matches")
        ? []
        : { ...session, endedAt: ended ? "2026-10-31T12:00:00.000Z" : null },
    });
  }) as typeof fetch;
  render(
    <AppRouterContext.Provider value={router as never}>
      <PathParamsContext.Provider
        value={{
          leagueId: "league-1",
          seasonId: "season-1",
          sessionId: "session-1",
        }}
      >
        <Provider store={store}>
          <V2ProfileNameProvider userId={null} fallbackName={null}>
            <Page />
          </V2ProfileNameProvider>
        </Provider>
      </PathParamsContext.Provider>
    </AppRouterContext.Provider>
  );
  await waitFor(() =>
    assert.ok(screen.getByRole("button", { name: "記録を再開" }))
  );
  assert.ok(screen.getByRole("heading", { name: "対局記録" }));
  assert.equal(screen.queryByRole("button", { name: "この記録を削除" }), null);
  fireEvent.click(screen.getByRole("button", { name: "記録を再開" }));
  await waitFor(() =>
    assert.ok(screen.getByRole("button", { name: "この記録を削除" }))
  );
  fireEvent.click(screen.getByRole("button", { name: "この記録を削除" }));
  let dialog = screen.getByRole("dialog", { name: "この記録を削除しますか？" });
  assert.match(dialog.textContent ?? "", /すべて削除/);
  assert.match(dialog.textContent ?? "", /太郎、花子/);
  assert.match(dialog.textContent ?? "", /2 局/);
  assert.match(dialog.textContent ?? "", /2026\/10\/31/);
  fireEvent.click(within(dialog).getByRole("button", { name: "キャンセル" }));
  assert.deepEqual(requests, []);
  fireEvent.click(screen.getByRole("button", { name: "この記録を削除" }));
  dialog = screen.getByRole("dialog", { name: "この記録を削除しますか？" });
  fireEvent.click(within(dialog).getByRole("button", { name: "削除する" }));
  await waitFor(() =>
    assert.deepEqual(navigations, ["/v2/league/league-1/season/season-1"])
  );
  assert.deepEqual(requests, [
    "/api/leagues/league-1/seasons/season-1/sessions/session-1",
  ]);
});
