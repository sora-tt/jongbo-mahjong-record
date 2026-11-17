import assert from "node:assert/strict";
import { test } from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";

import { StatisticsHub } from "./index";

test("全リーグを四麻・三麻の順に表示し、リーグごとに参加シーズンをまとめる", () => {
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
  const domNode = doc.defaultView!.Node;
  const cards = [...doc.querySelectorAll("section > section")];
  assert.deepEqual(
    cards.map((card) => card.querySelector("h2")?.textContent),
    ["青リーグ", "赤リーグ"]
  );
  const yonma = doc.querySelector('a[aria-label="四麻の成績"]');
  const sanma = doc.querySelector('a[aria-label="三麻の成績"]');
  assert.ok(yonma && sanma);
  assert.match(yonma.getAttribute("href") ?? "", /gameType=yonma/);
  assert.match(sanma.getAttribute("href") ?? "", /gameType=sanma/);
  assert.ok(
    yonma.compareDocumentPosition(sanma) & domNode.DOCUMENT_POSITION_FOLLOWING
  );
  assert.ok(
    sanma.compareDocumentPosition(cards[0]) &
      domNode.DOCUMENT_POSITION_FOLLOWING
  );
  assert.ok(yonma.querySelector(".lucide-users-round"));
  assert.ok(sanma.querySelector(".lucide-user-round"));
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
