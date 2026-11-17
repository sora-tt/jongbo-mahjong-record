import { strictEqual } from "node:assert";
import test from "node:test";

import * as React from "react";

import { renderToStaticMarkup } from "react-dom/server";

import { createDefaultFloatingCountUmaDraft } from "@/features/league/model/validation";

import { LeagueRuleEditor } from "./index";

const renderEditor = (
  overrides: Partial<React.ComponentProps<typeof LeagueRuleEditor>> = {}
) =>
  renderToStaticMarkup(
    <LeagueRuleEditor
      gameType="yonma"
      mode="floatingCount"
      fixedUma={{ first: "10", second: "5", third: "-5", fourth: "-10" }}
      floatingCountUma={createDefaultFloatingCountUmaDraft()}
      chomboPenaltyPoints="0"
      allowOffTableKyotaku={false}
      rotateSeatOrder={false}
      onModeChange={() => {}}
      onFixedUmaChange={() => {}}
      onFloatingCountUmaChange={() => {}}
      onChomboPenaltyPointsChange={() => {}}
      onAllowOffTableKyotakuChange={() => {}}
      onRotateSeatOrderChange={() => {}}
      {...overrides}
    />
  );

test("floating-count rule exposes all rows and invalid inputs with descriptions", () => {
  const draft = createDefaultFloatingCountUmaDraft();
  draft[3].second = "2.5";
  const markup = renderEditor({
    floatingCountUma: draft,
    showErrorSummary: true,
  });
  for (const count of [0, 1, 2, 3, 4])
    strictEqual(markup.includes(`id="floating-count-${count}-first"`), true);
  strictEqual(markup.includes('href="#floating-count-3-second"'), true);
  strictEqual(
    markup.includes('aria-describedby="floating-count-3-second-error"'),
    true
  );
});

test("sanma uses only three fixed ranks, and locked rules disable edits", () => {
  const markup = renderEditor({
    gameType: "sanma",
    mode: "floatingCount",
    disabled: true,
  });
  strictEqual(markup.includes('id="fixed-uma-third"'), true);
  strictEqual(markup.includes('id="fixed-uma-fourth"'), false);
  strictEqual(markup.includes("浮き人数別順位点"), false);
  strictEqual(markup.includes("disabled"), true);
});
