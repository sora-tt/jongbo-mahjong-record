import type { Match } from "@/types/domain/match";

import { dailyRecordData1 } from "@/mocks/daily-record";

export const useDailyRecordTable = () => {
  const dailyRecord = dailyRecordData1;

  const players = dailyRecord.players;

  const matches: Match[] = Object.values(dailyRecord.matches).sort((a, b) =>
    a.playedAt
      .format("yyyyMMddHHmmss")
      .localeCompare(b.playedAt.format("yyyyMMddHHmmss"))
  );

  const totals = dailyRecord.totalPoints;

  return {
    players,
    matches,
    totals,
  };
};
