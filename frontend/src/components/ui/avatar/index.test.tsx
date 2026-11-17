import assert from "node:assert/strict";
import { test } from "node:test";

import * as React from "react";

import { renderToStaticMarkup } from "react-dom/server";

import { Avatar, getAvatarInitial } from "./index";

test("表示名の先頭の文字を取得する", () => {
  assert.equal(getAvatarInitial(" 太郎 "), "太");
  assert.equal(getAvatarInitial("Alice"), "A");
  assert.equal(getAvatarInitial("👩‍💻さん"), "👩‍💻");
  assert.equal(getAvatarInitial("e\u0301mile"), "e\u0301");
  assert.equal(getAvatarInitial("  "), null);
  assert.equal(getAvatarInitial(null), null);
});

test("名前を表示し、名前がない場合はアイコンを表示する", () => {
  const named = renderToStaticMarkup(<Avatar name="太郎" />);
  assert.match(named, /aria-label="太郎のアバター"/);
  assert.match(named, /!bg-app-surface/);
  assert.match(named, /border-app-border/);
  assert.match(named, />太<\/span>/);
  assert.doesNotMatch(named, /<button/);

  const unnamed = renderToStaticMarkup(<Avatar name=" " />);
  assert.match(unnamed, /aria-label="アバター"/);
  assert.match(unnamed, /<svg/);
});
