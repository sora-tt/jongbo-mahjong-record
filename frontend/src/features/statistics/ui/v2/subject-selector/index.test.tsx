import assert from "node:assert/strict";
import { test } from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";

import { StatisticsSubjectSelector } from "./index";

test("選択中の参加者はラジオで示し、表示中文字を出さない", () => {
  const html = renderToStaticMarkup(
    <StatisticsSubjectSelector
      scopeType="season"
      viewerUserId="a"
      targetUserId="a"
      userName="太郎"
      members={[
        { userId: "a", userName: "太郎" },
        { userId: "b", userName: "花子" },
      ]}
      membersStatus="ready"
      membersError={null}
      onChangeTarget={() => {}}
      retryMembers={() => {}}
    />
  );
  const doc = new JSDOM(html).window.document;
  const radios = doc.querySelectorAll<HTMLInputElement>('input[type="radio"]');
  assert.equal(radios.length, 2);
  assert.equal(radios[0].checked, true);
  assert.equal(radios[1].checked, false);
  assert.doesNotMatch(doc.body.textContent ?? "", /表示中/);
  assert.doesNotMatch(doc.body.textContent ?? "", /現在:|（本人）/);
  assert.equal(doc.querySelectorAll('svg[aria-label="本人"]').length, 1);
  assert.match(radios[0].closest("label")?.textContent ?? "", /太郎さん/);
  assert.equal(
    radios[1].closest("label")?.querySelector('svg[aria-label="本人"]'),
    null
  );
});
