import { deepStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import * as React from "react";

import { renderToStaticMarkup } from "react-dom/server";

import { LeagueRuleSummary } from "./league-rule-summary";

import type { ApiLeague } from "@/lib/api/contracts";

const fixedRule: ApiLeague["rule"] = {
  gameType: "yonma",
  uma: {
    mode: "fixed",
    first: 10,
    second: 5,
    third: -5,
    fourth: -10,
  },
  oka: { startingPoints: 25000, returnPoints: 25000 },
};

const fixedSanmaRule: ApiLeague["rule"] = {
  gameType: "sanma",
  uma: { mode: "fixed", first: 10, second: 5, third: -5, fourth: null },
  oka: { startingPoints: 35000, returnPoints: 35000 },
};

const floatingCountRule: ApiLeague["rule"] = {
  gameType: "yonma",
  uma: {
    mode: "floatingCount",
    pointsByFloatingCount: {
      0: { first: 0, second: 0, third: 0, fourth: 0 },
      1: { first: 12, second: -1, third: -3, fourth: -8 },
      2: { first: 8, second: 4, third: -4, fourth: -8 },
      3: { first: 8, second: 3, third: 1, fourth: -12 },
      4: { first: 0, second: 0, third: 0, fourth: 0 },
    },
  },
  oka: { startingPoints: 25000, returnPoints: 25000 },
};

const renderSummary = (rule: ApiLeague["rule"]) =>
  renderToStaticMarkup(React.createElement(LeagueRuleSummary, { rule }));

test("fixed rule summary keeps the existing ordered uma display", () => {
  const markup = renderSummary(fixedRule);

  strictEqual(markup.includes("10 / 5 / -5 / -10"), true);
  strictEqual(markup.includes("floating-count-rule-basis"), false);
});

test("fixed sanma summary keeps its three-rank display", () => {
  const markup = renderSummary(fixedSanmaRule);

  strictEqual(markup.includes("10 / 5 / -5"), true);
  strictEqual(markup.includes("10 / 5 / -5 /"), false);
});

test("floating-count summary renders all points with an inclusive return-point basis", () => {
  const markup = renderSummary(floatingCountRule);
  const expectedPoints = [
    [0, 0, 0, 0],
    [12, -1, -3, -8],
    [8, 4, -4, -8],
    [8, 3, 1, -12],
    [0, 0, 0, 0],
  ];

  for (const floatingCount of [0, 1, 2, 3, 4]) {
    strictEqual(markup.includes(`${floatingCount}人浮き`), true);
  }
  const articles: string[] = [];
  for (const match of markup.matchAll(/<article\b[\s\S]*?<\/article>/g)) {
    articles.push(match[0]);
  }
  strictEqual(articles.length, 5);
  articles.forEach((article, index) => {
    const points: number[] = [];
    for (const match of article.matchAll(/<td\b[^>]*>(-?\d+)<\/td>/g)) {
      points.push(Number(match[1]));
    }
    deepStrictEqual(points, expectedPoints[index]);
  });
  for (const responsiveClass of [
    "grid-cols-1",
    "min-w-0",
    "w-full",
    "table-fixed",
  ]) {
    strictEqual(markup.includes(responsiveClass), true);
  }
  strictEqual(markup.includes("素点（raw score）"), true);
  strictEqual(markup.includes("返し点（25,000点）以上の人数です"), true);
  strictEqual(markup.includes("返し点と同点も含みます"), true);
  strictEqual((markup.match(/<caption/g) ?? []).length, 5);
  strictEqual((markup.match(/scope="col"/g) ?? []).length, 10);
  const basisDescriptionReference =
    'aria-describedby="floating-count-rule-basis"';
  strictEqual(markup.includes(basisDescriptionReference), true);
  strictEqual(markup.includes("overflow-x-auto"), false);
});
