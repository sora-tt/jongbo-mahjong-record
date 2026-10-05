import { deepStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import {
  getStatisticsDateRangeFromInput,
  getStatisticsDateRangeInputValues,
  getStatisticsLeagueOptions,
  getStatisticsSeasonOptionValue,
  selectStatisticsFilterLeague,
  selectStatisticsFilterScopeType,
  selectStatisticsFilterSeason,
  type StatisticsScopeOption,
} from "./scope-filter";

import type { StatisticsScopeFilters } from "./query-cache";

const scopeOptions: StatisticsScopeOption[] = [
  {
    leagueId: "league-1",
    leagueName: "東風リーグ",
    seasonId: "season-1",
    seasonName: "第1期",
  },
  {
    leagueId: "league-1",
    leagueName: "東風リーグ",
    seasonId: "season-2",
    seasonName: "第2期",
  },
  {
    leagueId: "league-2",
    leagueName: "半荘リーグ",
    seasonId: "season-3",
    seasonName: "第1期",
  },
];

const currentScope: StatisticsScopeFilters = {
  scopeType: "season",
  leagueId: "league-1",
  seasonId: "season-2",
  from: "2026-01-01T00:00:00+09:00",
  to: "2026-02-01T00:00:00+09:00",
  gameType: "sanma",
};

test("date inputs map to Tokyo half-open API bounds, including the selected end date", () => {
  deepStrictEqual(getStatisticsDateRangeFromInput("2026-01-01", "2026-01-31"), {
    from: "2026-01-01T00:00:00+09:00",
    to: "2026-02-01T00:00:00+09:00",
  });
  deepStrictEqual(getStatisticsDateRangeFromInput("2024-02-28", "2024-02-29"), {
    from: "2024-02-28T00:00:00+09:00",
    to: "2024-03-01T00:00:00+09:00",
  });
});

test("date inputs allow either open boundary and map empty values to all time", () => {
  deepStrictEqual(getStatisticsDateRangeFromInput("2026-03-10", ""), {
    from: "2026-03-10T00:00:00+09:00",
  });
  deepStrictEqual(getStatisticsDateRangeFromInput("", "2026-03-10"), {
    to: "2026-03-11T00:00:00+09:00",
  });
  deepStrictEqual(getStatisticsDateRangeFromInput("", ""), {});
});

test("date input values show Tokyo dates and an inclusive end date", () => {
  deepStrictEqual(
    getStatisticsDateRangeInputValues({
      from: "2026-01-01T00:00:00Z",
      to: "2026-02-01T00:00:00+09:00",
    }),
    { from: "2026-01-01", to: "2026-01-31" }
  );
  deepStrictEqual(
    getStatisticsDateRangeInputValues({
      from: "2026-01-01T16:00:00Z",
      to: "2026-01-03T00:00:00+09:00",
    }),
    { from: "2026-01-02", to: "2026-01-02" }
  );
});

test("invalid reversed date range is rejected", () => {
  strictEqual(
    getStatisticsDateRangeFromInput("2026-03-12", "2026-03-11"),
    null
  );
});

test("league choices are unique and keep the first display name", () => {
  deepStrictEqual(getStatisticsLeagueOptions(scopeOptions), [
    { id: "league-1", name: "東風リーグ" },
    { id: "league-2", name: "半荘リーグ" },
  ]);
});

test("scope type changes keep the common date and game type filters", () => {
  deepStrictEqual(
    selectStatisticsFilterScopeType(currentScope, "overall", scopeOptions),
    {
      scopeType: "overall",
      from: currentScope.from,
      to: currentScope.to,
      gameType: currentScope.gameType,
    }
  );
  deepStrictEqual(
    selectStatisticsFilterScopeType(currentScope, "league", scopeOptions),
    {
      scopeType: "league",
      leagueId: "league-1",
      from: currentScope.from,
      to: currentScope.to,
      gameType: currentScope.gameType,
    }
  );
  deepStrictEqual(
    selectStatisticsFilterScopeType(currentScope, "season", scopeOptions),
    currentScope
  );
});

test("league and season choices change scope while retaining common filters", () => {
  deepStrictEqual(
    selectStatisticsFilterLeague(currentScope, "league-2", scopeOptions),
    {
      scopeType: "league",
      leagueId: "league-2",
      from: currentScope.from,
      to: currentScope.to,
      gameType: currentScope.gameType,
    }
  );
  deepStrictEqual(
    selectStatisticsFilterSeason(
      currentScope,
      getStatisticsSeasonOptionValue({
        leagueId: "league-2",
        seasonId: "season-3",
      }),
      scopeOptions
    ),
    {
      scopeType: "season",
      leagueId: "league-2",
      seasonId: "season-3",
      from: currentScope.from,
      to: currentScope.to,
      gameType: currentScope.gameType,
    }
  );
});
