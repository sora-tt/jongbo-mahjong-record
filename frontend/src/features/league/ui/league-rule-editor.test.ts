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
  strictEqual(markup.includes("md:table"), true);
  strictEqual(markup.includes("hidden md:table-header-group"), true);
  strictEqual(markup.includes("grid-cols-2"), true);
  strictEqual(markup.includes("overflow-x-auto"), false);
  strictEqual(markup.includes("aria-labelledby="), true);
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

  strictEqual(markup.includes("順位点の方式"), false);
  strictEqual(markup.includes("浮き人数別順位点"), false);
  strictEqual(markup.includes('id="fixed-uma-first"'), true);
  strictEqual(markup.includes('id="fixed-uma-second"'), true);
  strictEqual(markup.includes('id="fixed-uma-third"'), true);
  strictEqual(markup.includes('id="fixed-uma-fourth"'), false);
});
