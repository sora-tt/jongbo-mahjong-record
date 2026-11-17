import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  pretendToBeVisual: true,
  url: "http://localhost",
});
Object.defineProperties(globalThis, {
  self: { configurable: true, value: dom.window },
  window: { configurable: true, value: dom.window },
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

const originalFetch = globalThis.fetch;
const setup = Promise.all([
  import("@testing-library/react"),
  import("./profile-name-provider"),
  import("@/components/ui/avatar"),
]);
afterEach(async () => {
  const [testing] = await setup;
  testing.cleanup();
  globalThis.fetch = originalFetch;
});

test("画面の切り替え中も表示名を維持し、ユーザーごとに分離する", async () => {
  const [
    { render, screen },
    { ProfileNameProvider, useProfileName },
    { Avatar },
  ] = await setup;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ data: { name: "太郎" } }), { status: 200 });

  const Header = () => {
    const { profileName } = useProfileName();
    return <Avatar name={profileName} />;
  };
  const view = render(
    <ProfileNameProvider userId="first" fallbackName={null}>
      <Header key="home" />
    </ProfileNameProvider>
  );
  assert.equal(
    (await screen.findByRole("img", { name: "太郎のアバター" })).textContent,
    "太"
  );

  view.rerender(
    <ProfileNameProvider userId="first" fallbackName={null}>
      <Header key="loading-statistics" />
    </ProfileNameProvider>
  );
  assert.equal(
    screen.getByRole("img", { name: "太郎のアバター" }).textContent,
    "太"
  );

  view.rerender(
    <ProfileNameProvider userId="second" fallbackName="花子">
      <Header key="new-user" />
    </ProfileNameProvider>
  );
  assert.equal(
    screen.getByRole("img", { name: "花子のアバター" }).textContent,
    "花"
  );
});

test("保存した表示名を古い取得結果で上書きしない", async () => {
  const [
    { act, fireEvent, render, screen },
    { ProfileNameProvider, useProfileName },
  ] = await setup;
  let resolveRequest!: (response: Response) => void;
  globalThis.fetch = () =>
    new Promise((resolve) => {
      resolveRequest = resolve;
    });

  const Editor = () => {
    const { profileName, setProfileName } = useProfileName();
    return (
      <button onClick={() => setProfileName("花子")}>
        {profileName ?? "未取得"}
      </button>
    );
  };
  render(
    <ProfileNameProvider userId="first" fallbackName={null}>
      <Editor />
    </ProfileNameProvider>
  );
  fireEvent.click(screen.getByRole("button", { name: "未取得" }));
  await act(async () => {
    resolveRequest(
      new Response(JSON.stringify({ data: { name: "太郎" } }), { status: 200 })
    );
  });
  assert.ok(screen.getByRole("button", { name: "花子" }));
});
