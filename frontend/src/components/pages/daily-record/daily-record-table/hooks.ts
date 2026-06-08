import { dailyRecordData1 } from "@/mocks/daily-record";

import type { DailyRecordTableMatch } from ".";

export const useDailyRecordTable = () => {
  const dailyRecord = dailyRecordData1;

  const players = dailyRecord.players;

  const matches: DailyRecordTableMatch[] = Object.values(
    dailyRecord.matches
  ).sort(
    (a, b) => a.playedAt.toDate().getTime() - b.playedAt.toDate().getTime()
  );

  const totals = dailyRecord.totalPoints;

  return {
    players,
    matches,
    totals,
  };
};
