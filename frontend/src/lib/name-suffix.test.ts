import assert from "node:assert/strict";
import { test } from "node:test";

import { formatDetailTitle } from "./name-suffix";

test("詳細タイトルに種別を付け、すでにある場合は重複させない", () => {
  assert.equal(formatDetailTitle("雀望", "リーグ"), "雀望リーグ");
  assert.equal(formatDetailTitle("雀望リーグ", "リーグ"), "雀望リーグ");
  assert.equal(formatDetailTitle("春", "シーズン"), "春シーズン");
  assert.equal(formatDetailTitle("春シーズン", "シーズン"), "春シーズン");
  assert.equal(formatDetailTitle(null, "リーグ"), "");
});
