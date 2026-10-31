import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const loginPage = readFileSync(
  new URL("../../app/login/page.tsx", import.meta.url),
  "utf8"
);
const header = readFileSync(
  new URL("./header/index.tsx", import.meta.url),
  "utf8"
);

test("login footer links to the public install guide", () => {
  assert.match(
    loginPage,
    /\{ href: "\/install", label: "ホーム画面に追加する" \}/
  );
});

test("mobile drawer links to the install guide and closes on navigation", () => {
  const drawer = header.match(/<aside\b[\s\S]*?<\/aside>/)?.[0];

  assert.ok(drawer, "the mobile navigation drawer should be present");
  assert.match(
    drawer,
    /<Link\s+href="\/install"\s+onClick=\{closeMenu\}[\s\S]*?ホーム画面に追加する[\s\S]*?<\/Link>/
  );
});
