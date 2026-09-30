import type {
  ActiveSeasonSummary,
  IsoDateString,
  LeagueId,
  Nullable,
  OpaqueId,
  RecordHolder,
  UserReference,
} from "@/domain/shared/types.js";

export type FloatingCount = 0 | 1 | 2 | 3 | 4;

export type RankPoints = {
  first: number;
  second: number;
  third: number;
  fourth: number;
};

export type FixedYonmaUma = {
  mode: "fixed";
  first: number;
  second: number;
  third: number;
  fourth: number;
};

export type FixedSanmaUma = {
  mode: "fixed";
  first: number;
  second: number;
  third: number;
  fourth: null;
};

export type FloatingCountUma = {
  mode: "floatingCount";
  pointsByFloatingCount: Record<FloatingCount, RankPoints>;
};

export type UmaRule = FixedSanmaUma | FixedYonmaUma | FloatingCountUma;

export type LeagueRule =
  | {
      gameType: "sanma";
      uma: FixedSanmaUma;
      oka: { startingPoints: number; returnPoints: number };
    }
  | {
      gameType: "yonma";
      uma: FixedYonmaUma | FloatingCountUma;
      oka: { startingPoints: number; returnPoints: number };
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
