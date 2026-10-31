import { strictEqual } from "node:assert";
import test from "node:test";

import * as React from "react";

import { renderToStaticMarkup } from "react-dom/server";

test("install guide presents text instructions for iPhone Safari and Android Chrome", async () => {
  const guideModule = await import("./install-guide-content").catch(() => null);
  strictEqual(
    typeof guideModule?.InstallGuideContent,
    "function",
    "the install guide content component should be available"
  );

  const markup = renderToStaticMarkup(
    React.createElement(guideModule!.InstallGuideContent)
  );

  strictEqual(markup.includes("iPhone・Safari"), true);
  strictEqual(markup.includes("Android・Chrome"), true);
  strictEqual(markup.includes("共有"), true);
  strictEqual(markup.includes("ホーム画面に追加"), true);
  strictEqual(markup.includes("Webアプリとして開く"), true);
  strictEqual(markup.includes("有効"), true);
  strictEqual(markup.includes("Chrome"), true);
  strictEqual(markup.includes("表示名"), true);
  strictEqual(markup.includes("ネイティブアプリではありません"), true);
  strictEqual(
    markup.includes("Safariとはログイン状態が共有されない場合があります"),
    true
  );
  strictEqual((markup.match(/<ol\b/g) ?? []).length, 2);
});
