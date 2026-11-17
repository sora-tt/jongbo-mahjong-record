import assert from "node:assert/strict";
import { test } from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";

import { StatisticsHub } from "./index";

test("リーグ別に通算と参加シーズンを表示し、全リーグは最後に置く", () => {
  const html = renderToStaticMarkup(
    <StatisticsHub
      viewerUserId="user-1"
      leagues={[
        {
          id: "league-1",
          name: "青リーグ",
          activeSeason: { id: "s1", name: "春" },
        },
        { id: "league-2", name: "赤リーグ", activeSeason: null },
      ]}
      seasons={[
        {
          id: "a",
          leagueId: "league-1",
          leagueName: "青リーグ",
          seasonId: "s1",
          seasonName: "春",
        },
        {
          id: "b",
          leagueId: "league-1",
          leagueName: "青リーグ",
          seasonId: "s2",
          seasonName: "冬",
        },
        {
          id: "c",
          leagueId: "league-2",
          leagueName: "赤リーグ",
          seasonId: "s3",
          seasonName: "秋",
        },
      ]}
      status="ready"
      onRetry={() => {}}
    />
  );
  const doc = new JSDOM(html).window.document;
  const cards = [...doc.querySelectorAll("section > section")];
  assert.deepEqual(
    cards.map((card) => card.querySelector("h2")?.textContent),
    ["青リーグ", "赤リーグ", "全リーグ・全期間"]
  );
  assert.match(cards[0].textContent ?? "", /リーグ通算/);
  assert.match(cards[0].textContent ?? "", /春/);
  assert.match(cards[0].querySelector("details")?.textContent ?? "", /冬/);
  assert.equal(cards[0].querySelector("details")?.open, false);
  assert.match(cards[1].querySelector("details")?.textContent ?? "", /秋/);
  const links = [...doc.querySelectorAll("a")].map(
    (link) => link.getAttribute("href") ?? ""
  );
  assert.ok(links.some((href) => href.includes("seasonId=s1")));
  assert.ok(links.some((href) => href.includes("seasonId=s2")));
  assert.ok(links.some((href) => href.includes("seasonId=s3")));
});
