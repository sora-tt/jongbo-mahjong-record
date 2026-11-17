import assert from "node:assert/strict";
import test from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";

import { Status } from "@/components/ui/status";

import { LoadingState } from "./index";

test("loading indicators retain a screen-reader message without visible text", () => {
  for (const node of [
    <LoadingState key="page" label="読み込み中" />,
    <Status key="inline" loading message="読み込み中" />,
  ]) {
    const document = new JSDOM(renderToStaticMarkup(node)).window.document;
    const status = document.querySelector('[role="status"]');
    assert.ok(status?.querySelector('svg[aria-hidden="true"]'));
    assert.equal(status?.querySelector(".sr-only")?.textContent, "読み込み中");
  }
});

test("error messages remain visible", () => {
  const document = new JSDOM(
    renderToStaticMarkup(<Status message="読み込みに失敗しました" />)
  ).window.document;
  assert.equal(
    document.querySelector('[role="alert"]')?.textContent,
    "読み込みに失敗しました"
  );
  assert.equal(document.querySelector(".sr-only"), null);
});
