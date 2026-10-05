import { deepStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import {
  getStatisticsPagePanelState,
  getStatisticsPagePeriodLabel,
  getStatisticsPageSubjectLabel,
  getStatisticsPageScopeOptions,
  mergeStatisticsAnalysisPages,
} from "./page";

test("joining season options are mapped to the shared statistics scope shape", () => {
  deepStrictEqual(
    getStatisticsPageScopeOptions([
      {
        id: "league-1:season-1",
        leagueId: "league-1",
        leagueName: "雀荘リーグ",
        seasonId: "season-1",
        seasonName: "春季",
      },
    ]),
    [
      {
        leagueId: "league-1",
        leagueName: "雀荘リーグ",
        seasonId: "season-1",
        seasonName: "春季",
      },
    ]
  );
});

test("page subject label identifies self and selected league or season members", () => {
  strictEqual(
    getStatisticsPageSubjectLabel({
      viewerUserId: "viewer-1",
      targetUserId: "viewer-1",
      viewerName: "花子",
      members: [],
    }),
    "花子"
  );
  strictEqual(
    getStatisticsPageSubjectLabel({
      viewerUserId: "viewer-1",
      targetUserId: "member-2",
      viewerName: "花子",
      members: [{ userId: "member-2", userName: "太郎" }],
    }),
    "太郎"
  );
  strictEqual(
    getStatisticsPageSubjectLabel({
      viewerUserId: "viewer-1",
      targetUserId: "member-2",
      viewerName: "花子",
      members: [],
    }),
    "選択中の参加者"
  );
});

test("panel states keep query lifecycle outcomes distinct", () => {
  strictEqual(getStatisticsPagePanelState("idle", null, null).kind, "idle");
  strictEqual(
    getStatisticsPagePanelState("loading", null, null).kind,
    "loading"
  );
  strictEqual(
    getStatisticsPagePanelState("empty", { value: 0 }, null).kind,
    "empty"
  );
  strictEqual(
    getStatisticsPagePanelState("uncomputed", null, null).kind,
    "uncomputed"
  );
  deepStrictEqual(
    getStatisticsPagePanelState("error", null, "取得に失敗しました"),
    { kind: "error", message: "取得に失敗しました" }
  );
});

test("ready panel state never exposes missing query data as a result", () => {
  strictEqual(getStatisticsPagePanelState("ready", null, null).kind, "loading");
  deepStrictEqual(getStatisticsPagePanelState("ready", { value: 42 }, null), {
    kind: "ready",
    data: { value: 42 },
  });
});

test("period label distinguishes full, start-only, end-only, and bounded ranges", () => {
  strictEqual(getStatisticsPagePeriodLabel({}), "全期間");
  strictEqual(
    getStatisticsPagePeriodLabel({
      from: "2026-01-01T00:00:00+09:00",
    }),
    "2026/01/01以降"
  );
  strictEqual(
    getStatisticsPagePeriodLabel({
      to: "2026-02-01T00:00:00+09:00",
    }),
    "2026/01/31まで"
  );
  strictEqual(
    getStatisticsPagePeriodLabel({
      from: "2026-01-01T15:00:00.000Z",
      to: "2026-02-01T15:00:00.000Z",
    }),
    "2026/01/02〜2026/02/01"
  );
});

test("analysis page merge appends rows once and keeps the base progression", () => {
  const firstPage = {
    status: "ready",
    progression: [{ matchId: "match-1" }],
    breakdown: {
      dimension: "opponent",
      rows: [{ userId: "user-1" }],
      nextCursor: "cursor-2",
    },
  };
  const secondPage = {
    status: "ready",
    progression: [{ matchId: "match-1" }],
    breakdown: {
      dimension: "opponent",
      rows: [{ userId: "user-2" }],
      nextCursor: null,
    },
  };

  deepStrictEqual(mergeStatisticsAnalysisPages(firstPage, secondPage), {
    ...firstPage,
    breakdown: {
      ...firstPage.breakdown,
      rows: [{ userId: "user-1" }, { userId: "user-2" }],
      nextCursor: null,
    },
  });
});

test("analysis page merge replaces empty and uncomputed page responses", () => {
  const current = {
    status: "ready",
    progression: [],
    breakdown: {
      dimension: "opponent",
      rows: [{ userId: "user-1" }],
      nextCursor: "cursor-2",
    },
  };
  const incompatible = {
    status: "ready",
    progression: [],
    breakdown: {
      dimension: "session",
      rows: [{ sessionId: "session-2" }],
      nextCursor: null,
    },
  };
  const empty = {
    status: "empty",
    progression: [],
    breakdown: { dimension: "opponent", rows: [], nextCursor: null },
  };

  strictEqual(
    mergeStatisticsAnalysisPages(current, incompatible),
    incompatible
  );
  strictEqual(mergeStatisticsAnalysisPages(current, empty), empty);
  const uncomputed = {
    status: "uncomputed",
    scope: { scopeType: "season" },
    generatedAt: null,
  };
  strictEqual(mergeStatisticsAnalysisPages(current, uncomputed), uncomputed);
});
