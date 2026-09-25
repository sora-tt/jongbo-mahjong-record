import type {
  ActiveSeasonSummary,
  GameType,
  IsoDateString,
  LeagueId,
  Nullable,
  OpaqueId,
  RecordHolder,
  UserReference,
} from "@/domain/shared/types.js";

export type LeagueRule = {
  gameType: GameType;
  uma: {
    first: number;
    second: number;
    third: number;
    fourth: Nullable<number>;
  };
  oka: {
    startingPoints: number;
    returnPoints: number;
  };
};

export type LeagueMember = UserReference & { id: OpaqueId };

export type LeagueSummary = {
  id: LeagueId;
  name: string;
  memberCount: number;
  totalMatchCount: number;
  activeSeason: Nullable<ActiveSeasonSummary>;
  myStanding: Nullable<{
    rank: number | null;
    totalPoints: number | null;
  }>;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type LeagueDetail = {
  id: LeagueId;
  name: string;
  rule: LeagueRule;
  memberCount: number;
  totalMatchCount: number;
  activeSeason: Nullable<ActiveSeasonSummary>;
  members: LeagueMember[];
  leagueRecords: Nullable<{
    winStreak: RecordHolder | null;
    loseStreak: RecordHolder | null;
    highestScore: RecordHolder | null;
    lowestScore: RecordHolder | null;
  }>;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};
