import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";

import { SeasonMembers } from "./index";

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
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: true },
});

const setup = import("@testing-library/react");
afterEach(async () => (await setup).cleanup());

test("members can be toggled while locked members remain selected and disabled", async () => {
  const { render, fireEvent, screen } = await setup;
  const toggled: string[] = [];
  render(
    <SeasonMembers
      members={[
        { userId: "one", userName: "一郎" },
        { userId: "two", userName: "二郎" },
      ]}
      selectedIds={[]}
      lockedIds={["one"]}
      onToggle={(id) => toggled.push(id)}
    />
  );
  const locked = screen.getByRole("checkbox", {
    name: "一郎を選択",
  }) as HTMLInputElement;
  const selectable = screen.getByRole("checkbox", {
    name: "二郎を選択",
  }) as HTMLInputElement;
  assert.equal(locked.checked, true);
  assert.equal(locked.disabled, true);
  assert.equal(selectable.checked, false);
  locked.click();
  fireEvent.click(selectable);
  assert.deepEqual(toggled, ["two"]);
});
