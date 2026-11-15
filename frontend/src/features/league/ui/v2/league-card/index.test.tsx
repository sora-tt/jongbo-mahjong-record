import { strictEqual } from "node:assert";
import test from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";

import { LeagueCard } from "./index";

type League = React.ComponentProps<typeof LeagueCard>["league"];
const league = {
  id: "league-1",
  name: "テストリーグ",
  memberCount: 4,
  totalMatchCount: 5,
  activeSeason: { id: "season-1", name: "春シーズン" },
  myStanding: { rank: 1, totalPoints: 42 },
} as unknown as League;

const renderCard = (item: League) =>
  new JSDOM(renderToStaticMarkup(<LeagueCard league={item} userId="user-1" />))
    .window.document;

test("league card has separate links for league, season, statistics and recording", () => {
  const doc = renderCard(league);
  strictEqual(doc.querySelectorAll("article").length, 1);
  const links = Array.from(doc.querySelectorAll("a"));
  const find = (text: string) =>
    links.find((link) => link.textContent?.trim() === text);
  strictEqual(
    doc
      .querySelector('a[aria-label="テストリーグのリーグ詳細"]')
      ?.getAttribute("href"),
    "/v2/league/league-1"
  );
  strictEqual(
    find("詳細")?.getAttribute("href"),
    "/v2/league/league-1/season/season-1"
  );
  strictEqual(
    find("記録")?.getAttribute("href"),
    "/v2/league/league-1/season/season-1/sessions/start/players"
  );
  const stats = find("今シーズンの成績");
  const statsUrl = new URL(
    stats?.getAttribute("href") ?? "",
    "http://localhost"
  );
  strictEqual(statsUrl.pathname, "/v2/stats");
  strictEqual(statsUrl.searchParams.get("seasonId"), "season-1");
  strictEqual(statsUrl.searchParams.get("targetUserId"), "user-1");
  strictEqual(statsUrl.searchParams.get("returnTo"), "/v2");
  strictEqual(doc.querySelector("a a"), null);
});

test("without an active season only the league link remains", () => {
  const doc = renderCard({ ...league, activeSeason: null });
  strictEqual(doc.querySelectorAll("a").length, 1);
  strictEqual(
    doc.querySelector("a")?.getAttribute("href"),
    "/v2/league/league-1"
  );
});
