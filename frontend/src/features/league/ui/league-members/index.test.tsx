import assert from "node:assert/strict";
import test from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";

import { LeagueMembers } from "./index";

test("each member chip links to that member's statistics in the league", () => {
  const members = ["太郎", "花子", "次郎", "美咲", "長いユーザー名の例"].map(
    (userName, index) => ({ userId: `user-${index}`, userName })
  );
  const markup = renderToStaticMarkup(
    <LeagueMembers
      members={members}
      league={{ id: "league-1", name: "友人戦", rule: { gameType: "yonma" } }}
    />
  );
  const document = new JSDOM(markup).window.document;
  const links = [...document.querySelectorAll("a")];
  assert.equal(links.length, 5);
  links.forEach((link, index) => {
    const url = new URL(link.href, "http://localhost");
    assert.equal(
      link.getAttribute("aria-label"),
      `${members[index].userName}の成績`
    );
    assert.equal(url.pathname, "/stats");
    assert.equal(url.searchParams.get("scopeType"), "league");
    assert.equal(url.searchParams.get("leagueId"), "league-1");
    assert.equal(url.searchParams.get("gameType"), "yonma");
    assert.equal(url.searchParams.get("targetUserId"), `user-${index}`);
    assert.equal(url.searchParams.get("returnTo"), "/league/league-1");
  });
});
