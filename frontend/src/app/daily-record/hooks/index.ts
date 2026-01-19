// src/app/daily-record/hooks/index.ts
import { dailyRecordData1 } from "@/mocks/daily-record";
import { leaguesData } from "@/mocks/league";

const WIND_ORDER = ["EAST", "SOUTH", "WEST", "NORTH"] as const;

export const useDailyRecord = () => {
  const record = dailyRecordData1;

  const { matches, leagueId, date } = record;

  const league = leaguesData.find((l) => l.id === leagueId) ?? null;
  const dateLabel = date.format("yyyy/MM/dd");
  const ruleLabel = league?.ruleName ?? "";

  const sortedMatchIndexes = Object.keys(matches)
    .map((k) => Number(k))
    .sort((a, b) => a - b);

  const sortedMatches = sortedMatchIndexes.map((idx) => ({
    index: idx,
    match: matches[idx],
  }));

  const firstMatch = sortedMatches[0]?.match;

  const players =
    firstMatch != null
      ? WIND_ORDER.map(
          (windKey) => firstMatch.results.matchResultInput[windKey].player
        )
      : [];

  const totals = players.map((player) =>
    sortedMatches.reduce((sum, { match }) => {
      const input = match.results.matchResultInput;
      const resultArray = WIND_ORDER.map((w) => input[w]);
      const resultForPlayer = resultArray.find(
        (r) => r.player.id === player.id
      );
      const pt = resultForPlayer?.score ?? 0;
      return sum + pt;
    }, 0)
  );

  return {
    record,
    league,
    dateLabel,
    ruleLabel,
    players,
    sortedMatches,
    totals,
  };
};
