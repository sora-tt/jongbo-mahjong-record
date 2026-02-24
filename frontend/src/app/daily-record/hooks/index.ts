import type { Match } from "@/types/domain/match";

import { dailyRecordData1 } from "@/mocks/daily-record";
import { leaguesData } from "@/mocks/league";

export const useDailyRecord = () => {
  const record = dailyRecordData1;

  const league = Object.values(leaguesData).find(
    (l) => l.leagueId === record.leagueId
  )!;

  const date = record.date.format("yyyy/MM/dd");
  const rule = league.rule.name;

  const matches: Match[] = Object.values(record.matches);

  const players = record.players;
  const totals = record.totalPoints;

  return {
    date,
    rule,
    players,
    matches,
    totals,
  };
};
