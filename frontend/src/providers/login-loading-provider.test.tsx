import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";

import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";

import {
  LoginLoadingProvider,
  useLoginLoading,
} from "./login-loading-provider";

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

const Controls = () => {
  const { start, finish } = useLoginLoading();
  return (
    <>
      <button onClick={start}>start</button>
      <button onClick={finish}>finish</button>
    </>
  );
};
const App = ({ pathname }: { pathname: string }) => (
  <PathnameContext.Provider value={pathname}>
    <LoginLoadingProvider>
      <Controls />
    </LoginLoadingProvider>
  </PathnameContext.Provider>
);

test("loading continues across the home navigation until the home is ready", async () => {
  const { render, fireEvent, screen } = await setup;
  const view = render(<App pathname="/login" />);
  fireEvent.click(screen.getByText("start"));
  assert.ok(screen.getByRole("status"));
  view.rerender(<App pathname="/" />);
  assert.ok(screen.getByRole("status"));
  fireEvent.click(screen.getByText("finish"));
  assert.equal(screen.queryByRole("status"), null);
});

test("loading ends on an authentication error or a verification redirect", async () => {
  const { render, fireEvent, screen } = await setup;
  const view = render(<App pathname="/login" />);
  fireEvent.click(screen.getByText("start"));
  fireEvent.click(screen.getByText("finish"));
  assert.equal(screen.queryByRole("status"), null);
  fireEvent.click(screen.getByText("start"));
  view.rerender(<App pathname="/verify-email" />);
  assert.equal(screen.queryByRole("status"), null);
});
