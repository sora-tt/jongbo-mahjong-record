import type { RecordHolder } from "@/domain/shared/types.js";

export type LeagueMember = {
  id: string;
  userId: string;
  userName: string;
};

export type LeagueSummary = {
  id: string;
  name: string;
  memberCount: number;
  totalMatchCount: number;
  activeSeason: {
    id: string;
    name: string;
  } | null;
  myStanding: {
    rank: number | null;
    totalPoints: number | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type LeagueDetail = {
  id: string;
  name: string;
  rule: {
    gameType: "sanma" | "yonma";
    uma: {
      first: number;
      second: number;
      third: number;
      fourth: number | null;
    };
    oka: {
      startingPoints: number;
      returnPoints: number;
    };
  };
  memberCount: number;
  totalMatchCount: number;
  activeSeason: {
    id: string;
    name: string;
  } | null;
  members: LeagueMember[];
  leagueRecords: {
    winStreak: RecordHolder | null;
    loseStreak: RecordHolder | null;
    highestScore: RecordHolder | null;
    lowestScore: RecordHolder | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};
