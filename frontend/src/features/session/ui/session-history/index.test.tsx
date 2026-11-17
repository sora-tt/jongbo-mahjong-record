import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";

import { SessionHistory } from "./index";

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
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: true },
});

const setup = import("@testing-library/react");
afterEach(async () => (await setup).cleanup());

test("history links preserve the session route without a delete button", async () => {
  const { render, screen } = await setup;
  const sessions = [
    {
      id: "session-1",
      startedAt: "2026-11-05T12:00:00Z",
      endedAt: "2026-11-05T13:00:00Z",
      totalMatchCount: 4,
      memberCount: 2,
      members: [{ userName: "太郎" }, { userName: "花子" }],
      tableLabel: "A",
    },
  ] as unknown as React.ComponentProps<typeof SessionHistory>["sessions"];
  render(
    <SessionHistory
      sessions={sessions}
      leagueId="league-1"
      seasonId="season-1"
    />
  );
  const link = screen.getByRole("link");
  assert.equal(
    link.getAttribute("href"),
    "/league/league-1/season/season-1/sessions/session-1/results"
  );
  assert.ok(link.textContent?.includes("11月05日"));
  assert.ok(link.textContent?.includes("4局"));
  assert.ok(link.textContent?.includes("太郎、花子"));
  assert.equal(link.querySelector("button"), null);
  assert.equal(screen.queryByRole("button", { name: /を削除/ }), null);
});
