import { LeagueRecord } from "@/types/domain/league";

export const leagueRecordData1: LeagueRecord = {
  longestWinStreak: { count: 5, playerName: "岩田" },
  longestLoseStreak: { count: 4, playerName: "野口" },
  currentHighestScore: { score: 48000, playerName: "岩田" },
  currentLowestScore: { score: -12000, playerName: "野口" },
};
