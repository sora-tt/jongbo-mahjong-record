import { strictEqual } from "node:assert";
import test from "node:test";

import * as React from "react";

import { renderToStaticMarkup } from "react-dom/server";

import {
  createDefaultFloatingCountUmaDraft,
  type FixedUmaDraft,
} from "@/features/league/model/validation";

import { LeagueRuleEditor } from "./league-rule-editor";

const fixedUma: FixedUmaDraft = {
  first: "10",
  second: "5",
  third: "-5",
  fourth: "-10",
};

const renderEditor = (
  overrides: Partial<React.ComponentProps<typeof LeagueRuleEditor>> = {}
) => {
  const props: React.ComponentProps<typeof LeagueRuleEditor> = {
    gameType: "yonma",
    mode: "floatingCount",
    fixedUma,
    floatingCountUma: createDefaultFloatingCountUmaDraft(),
    showErrorSummary: true,
    errorSummaryFocusToken: 1,
    onModeChange: () => {},
    onFixedUmaChange: () => {},
    onFloatingCountUmaChange: () => {},
    ...overrides,
  };

  return renderToStaticMarkup(React.createElement(LeagueRuleEditor, props));
};

test("fixed rank points preserve the original four-column Uma input grid", () => {
  const markup = renderEditor({ mode: "fixed" });

  strictEqual(markup.includes('class="grid grid-cols-4 gap-2"'), true);
  strictEqual(markup.includes('label for="fixed-uma-first"'), true);
  strictEqual(markup.includes('id="fixed-uma-fourth"'), true);
  strictEqual(markup.includes("方式"), true);
  strictEqual(markup.includes("固定順位点"), true);
  strictEqual(markup.includes("浮き人数別順位点"), true);
  strictEqual(markup.includes('type="radio"'), false);

  const labels = ["1位", "2位", "3位", "4位"];
  const labelPositions = labels.map((label) => markup.indexOf(label));
  strictEqual(
    labelPositions.every((position) => position >= 0),
    true
  );
  strictEqual(
    labelPositions.every(
      (position, index) => index === 0 || labelPositions[index - 1] < position
    ),
    true
  );
});

test("floating-count editor renders all five responsive rows with labelled inputs", () => {
  const markup = renderEditor();

  for (const floatingCount of [0, 1, 2, 3, 4]) {
    strictEqual(markup.includes(`${floatingCount}人浮き`), true);
    for (const rank of ["first", "second", "third", "fourth"]) {
      strictEqual(
        markup.includes(`id="floating-count-${floatingCount}-${rank}"`),
        true
      );
    }
  }
  strictEqual(markup.includes("table-fixed"), true);
  strictEqual(markup.includes('aria-label="0人浮きの1位"'), true);
  strictEqual(markup.includes("overflow-x-auto"), false);
  strictEqual(markup.includes("<caption"), true);
});

test("floating-count errors link to a field and describe its inline error", () => {
  const floatingCountUma = createDefaultFloatingCountUmaDraft();
  floatingCountUma[3].second = "2.5";

  const markup = renderEditor({ floatingCountUma });

  strictEqual(markup.includes('href="#floating-count-3-second"'), true);
  strictEqual(
    markup.includes('aria-describedby="floating-count-3-second-error"'),
    true
  );
  strictEqual(markup.includes("3人浮きの2位"), true);
});

test("floating-count row-total errors link to a field and describe the invalid row", () => {
  const floatingCountUma = createDefaultFloatingCountUmaDraft();
  floatingCountUma[2].first = "9";

  const markup = renderEditor({ floatingCountUma });

  strictEqual(markup.includes('href="#floating-count-2-first"'), true);
  strictEqual(
    markup.includes('aria-describedby="floating-count-2-total-error"'),
    true
  );
  strictEqual(
    markup.includes("2人浮きの順位点合計が0ではありません（現在: 1）"),
    true
  );
});

test("sanma editor only presents fixed rank points and hides the mode selector", () => {
  const markup = renderEditor({ gameType: "sanma", mode: "floatingCount" });

  strictEqual(markup.includes(">方式</h4>"), false);
  strictEqual(markup.includes("浮き人数別順位点"), false);
  strictEqual(markup.includes('id="fixed-uma-first"'), true);
  strictEqual(markup.includes('id="fixed-uma-second"'), true);
  strictEqual(markup.includes('id="fixed-uma-third"'), true);
  strictEqual(markup.includes('id="fixed-uma-fourth"'), false);
});

test("submit failures are included in the focusable error summary", () => {
  const markup = renderEditor({
    submitError: "リーグ設定の保存に失敗しました",
    errorSummaryFocusToken: 2,
  });

  strictEqual(markup.includes('role="alert"'), true);
  strictEqual(markup.includes('tabindex="-1"'), true);
  strictEqual(markup.includes("リーグ設定の保存に失敗しました"), true);
});
