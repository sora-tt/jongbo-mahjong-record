import type { RecordHolder, SeasonStatus } from "@/domain/shared/types.js";

export type SeasonMember = {
  userId: string;
  userName: string;
};

export type Standing = {
  rank: number;
  userId: string;
  userName: string;
  totalPoints: number;
  matchCount: number;
  firstCount: number;
  secondCount: number;
  thirdCount: number;
  fourthCount: number | null;
};

export type PointProgression = {
  userId: string;
  userName: string;
  points: Array<{
    matchIndex: number;
    totalPoints: number;
  }>;
};

export type SeasonSummary = {
  id: string;
  leagueId: string;
  name: string;
  status: SeasonStatus;
  memberCount: number;
  totalMatchCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SeasonDetail = {
  id: string;
  leagueId: string;
  name: string;
  status: SeasonStatus;
  memberCount: number;
  totalMatchCount: number;
  members: SeasonMember[];
  standings: Standing[];
  pointProgressions: PointProgression[];
  seasonRecords: {
    highestScore: RecordHolder | null;
    avoidLastRate: RecordHolder | null;
    top2Rate: RecordHolder | null;
  } | null;
  latestPlayedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type { RecordHolder };
