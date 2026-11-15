import assert from "node:assert/strict";
import test from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";

import { SEASON_NAME_SUFFIX_MODEL } from "@/lib/name-suffix";

import { SeasonNameField } from "./index";

test("the displayed suffix describes the input without duplicating the saved season name", () => {
  const savedName = "2026 冬シーズン";
  const value = SEASON_NAME_SUFFIX_MODEL.toInputValue(savedName);
  const document = new JSDOM(
    renderToStaticMarkup(<SeasonNameField value={value} onChange={() => {}} />)
  ).window.document;
  const input = document.querySelector("input");
  assert.ok(input);
  assert.equal(input.value, "2026 冬");
  assert.equal(
    document.getElementById(input.getAttribute("aria-describedby") ?? "")
      ?.textContent,
    "シーズン"
  );
  assert.equal(
    SEASON_NAME_SUFFIX_MODEL.toCanonicalName(input.value),
    savedName
  );
  assert.equal(
    SEASON_NAME_SUFFIX_MODEL.toCanonicalName("2026 冬シーズン"),
    savedName
  );
});
