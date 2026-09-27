import type {
  IsoDateString,
  LeagueId,
  Nullable,
  RecordHolder,
  SeasonId,
  SeasonStatus,
  UserId,
  UserReference,
} from "@/domain/shared/types.js";

export type SeasonMember = UserReference;

export type Standing = {
  rank: number;
  userId: UserId;
  userName: string;
  totalPoints: number;
  matchCount: number;
  firstCount: number;
  secondCount: number;
  thirdCount: number;
  fourthCount: number | null;
};

export type PointProgression = {
  userId: UserId;
  userName: string;
  points: Array<{
    matchIndex: number;
    totalPoints: number;
  }>;
};

export type SeasonSummary = {
  id: SeasonId;
  leagueId: LeagueId;
  name: string;
  status: SeasonStatus;
  memberCount: number;
  totalMatchCount: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type SeasonDetail = {
  id: SeasonId;
  leagueId: LeagueId;
  name: string;
  status: SeasonStatus;
  memberCount: number;
  totalMatchCount: number;
  members: SeasonMember[];
  standings: Standing[];
  pointProgressions: PointProgression[];
  seasonRecords: Nullable<{
    highestScore: RecordHolder | null;
    avoidLastRate: RecordHolder | null;
    top2Rate: RecordHolder | null;
  }>;
  latestPlayedAt: Nullable<IsoDateString>;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type { RecordHolder };
