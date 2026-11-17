import assert from "node:assert/strict";
import { test } from "node:test";

import * as React from "react";

import { renderToStaticMarkup } from "react-dom/server";

import { ProfileNameProvider } from "@/providers/profile-name-provider";

import { AppShell } from "./index";

Object.defineProperty(globalThis, "React", {
  configurable: true,
  value: React,
});

test("タイトルの読み込み中も詳細画面のヘッダーを維持する", () => {
  const markup = renderToStaticMarkup(
    <ProfileNameProvider userId={null} fallbackName={null}>
      <AppShell title="" backHref="/" settingsHref="/settings" />
    </ProfileNameProvider>
  );
  assert.match(markup, /aria-label="戻る"/);
  assert.match(markup, /aria-label="設定"/);
  assert.doesNotMatch(markup, /<h1/);
  assert.doesNotMatch(markup, /jongbo ホーム/);
});

test("タイトル取得後はヘッダーに名前を表示する", () => {
  const markup = renderToStaticMarkup(
    <ProfileNameProvider userId={null} fallbackName={null}>
      <AppShell title="雀望リーグ" />
    </ProfileNameProvider>
  );
  assert.match(markup, /<h1[^>]*>雀望リーグ<\/h1>/);
});
