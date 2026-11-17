import assert from "node:assert/strict";
import test from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";

import { Button } from "./index";

test("a loading button remains labelled, shows a loader, and cannot be submitted again", () => {
  const document = new JSDOM(
    renderToStaticMarkup(
      <Button loading leadingIcon={<span>追加</span>}>
        保存
      </Button>
    )
  ).window.document;
  const button = document.querySelector("button");
  assert.ok(button);
  assert.equal(button.disabled, true);
  assert.equal(button.getAttribute("aria-busy"), "true");
  assert.equal(button.textContent, "保存");
  assert.ok(button.querySelector('svg[aria-hidden="true"]'));
});
