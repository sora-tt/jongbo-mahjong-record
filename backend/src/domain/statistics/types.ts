import type {
  GameType,
  IsoDateString,
  LeagueId,
  MatchId,
  OpaqueId,
  SeasonId,
  SessionId,
  UserId,
  Wind,
} from "@/domain/shared/types.js";

export type StatisticsGameType = GameType;
export type StatisticsGameTypeFilter = "all" | StatisticsGameType;

type StatisticsFilters = {
  from?: IsoDateString;
  to?: IsoDateString;
  gameType?: StatisticsGameTypeFilter;
};

export type OverallStatisticsScope = StatisticsFilters & {
  scopeType: "overall";
  leagueId?: never;
  seasonId?: never;
};

export type LeagueStatisticsScope = StatisticsFilters & {
  scopeType: "league";
  leagueId: LeagueId;
  seasonId?: never;
};

export type SeasonStatisticsScope = StatisticsFilters & {
  scopeType: "season";
  leagueId: LeagueId;
  seasonId: SeasonId;
};

/** Query filters and scope identity shared by statistics requests and responses. */
export type StatisticsScope =
  | OverallStatisticsScope
  | LeagueStatisticsScope
  | SeasonStatisticsScope;

export type StatisticsReadIdentity = {
  viewerUserId: UserId;
  targetUserId: UserId;
};

export type StatisticsSummaryQuery = StatisticsScope & StatisticsReadIdentity;

export type BreakdownDimension =
  | "period"
  | "weekday"
  | "timeOfDay"
  | "seat"
  | "opponent"
  | "session";

export type StatisticsAnalysisQuery = StatisticsScope &
  StatisticsReadIdentity & {
    dimension: BreakdownDimension;
    groupBy?: "day" | "month" | "year";
    windowSize: 10 | 20 | 50;
    limit?: number;
    /** Opaque continuation token for opponent/session breakdown rows. */
    cursor?: string;
  };

export type StatisticsMatchHistoryQuery = StatisticsScope &
  StatisticsReadIdentity & {
    limit: number;
    /** Opaque continuation token for the next history page. */
    cursor?: string;
  };

export type RateCount = {
  count: number;
  denominator: number;
  rate: number | null;
};

export type NumericSummary = {
  matchCount: number;
  average: number | null;
  maximum: number | null;
  minimum: number | null;
  median: number | null;
  populationStandardDeviation: number | null;
};

export type FormatSummary = {
  gameType: StatisticsGameType;
  matchCount: number;
  totalPoints: number;
  averageFinalPoint: number | null;
  averageRank: number | null;
  ranks: Array<{ rank: number; count: number; rate: number | null }>;
  topRate: number | null;
  topTwoRate: number | null;
  topThreeRate: number | null;
  lastRate: number | null;
  lastAvoidanceRate: number | null;
};

export type StatisticsMatchReference = {
  matchId: MatchId;
  leagueId: LeagueId;
  leagueName: string;
  seasonId: SeasonId;
  seasonName: string;
  sessionId: SessionId;
  sessionLabel: string | null;
  playedAt: IsoDateString;
};

export type PersonalStatisticsSummary = {
  status: "ready" | "empty";
  scope: StatisticsScope;
  generatedAt: IsoDateString;
  timeZone: "Asia/Tokyo";
  totals: {
    totalMatchCount: number;
    sessionCount: number;
    totalPoints: number;
    averageFinalPoint: number | null;
    chomboCount: number;
  };
  byGameType: FormatSummary[];
  rawScore: NumericSummary;
  finalPoint: NumericSummary & {
    positive: RateCount;
    negative: RateCount;
    even: RateCount;
  };
  scoreByRank: Array<{
    gameType: StatisticsGameType;
    rank: number;
    matchCount: number;
    averageRawScore: number | null;
    averageFinalPoint: number | null;
  }>;
  records: {
    highestRawScore: { value: number; match: StatisticsMatchReference } | null;
    lowestRawScore: { value: number; match: StatisticsMatchReference } | null;
    highestFinalPoint: {
      value: number;
      match: StatisticsMatchReference;
    } | null;
    lowestFinalPoint: { value: number; match: StatisticsMatchReference } | null;
  };
  streaks: Array<{
    type: "top" | "last" | "topTwo" | "positive" | "negative";
    currentCount: number;
    longestCount: number;
  }>;
  recentResults: Array<{
    windowSize: 10 | 20 | 50;
    matchCount: number;
    totalPoints: number;
    byGameType: FormatSummary[];
  }>;
  currentStanding: {
    rank: number;
    totalPoints: number;
    pointsBehindAbove: number | null;
    pointsAheadBelow: number | null;
    source: "season" | "activeSeason";
  } | null;
};

export type StatisticsAnalysis = {
  status: "ready" | "empty";
  scope: StatisticsScope;
  generatedAt: IsoDateString;
  timeZone: "Asia/Tokyo";
  windowSize: 10 | 20 | 50;
  /** Ordered by playedAt, sessionId, matchIndex, and matchId. */
  progression: Array<{
    playedAt: IsoDateString;
    matchId: MatchId;
    matchIndex: number;
    gameType: StatisticsGameType;
    point: number;
    cumulativePoint: number;
  }>;
  breakdown: StatisticsBreakdown;
};

export type StatisticsBreakdown =
  | {
      dimension: "period" | "weekday" | "timeOfDay" | "seat";
      rows: Array<{
        key: string;
        label: string;
        gameType: StatisticsGameType;
        matchCount: number;
        denominator: number;
        totalPoints: number;
        averageRank: number | null;
        topRate: number | null;
        averageFinalPoint: number | null;
        rankCounts: Array<{ rank: number; count: number }>;
      }>;
      nextCursor: null;
    }
  | {
      dimension: "opponent";
      rows: Array<{
        userId: UserId;
        userName: string;
        gameType: StatisticsGameType;
        encounterCount: number;
        aboveRate: number | null;
        tieCount: number;
        totalPointDifference: number;
        averagePointDifference: number;
      }>;
      nextCursor: string | null;
    }
  | {
      dimension: "session";
      rows: Array<{
        sessionId: SessionId;
        label: string;
        matchCount: number;
        totalPoints: number;
        averageRankByGameType: FormatSummary[];
        topCountByGameType: Array<{
          gameType: StatisticsGameType;
          count: number;
        }>;
      }>;
      nextCursor: string | null;
    };

export type StatisticsAnalysisResult =
  | StatisticsAnalysis
  | {
      status: "uncomputed";
      scope: StatisticsScope;
      generatedAt: null;
      timeZone: "Asia/Tokyo";
      windowSize: 10 | 20 | 50;
    };

export type PersonalStatisticsResult =
  | PersonalStatisticsSummary
  | {
      status: "uncomputed";
      scope: StatisticsScope;
      generatedAt: null;
      timeZone: "Asia/Tokyo";
    };

export type PersonalStatisticsSnapshotValues = Omit<
  PersonalStatisticsSummary,
  "status" | "scope" | "generatedAt" | "timeZone"
>;

export type PersonalStatisticsSnapshot = {
  all: PersonalStatisticsSnapshotValues;
  byGameType: Array<{
    gameType: StatisticsGameType;
    summary: Omit<PersonalStatisticsSnapshotValues, "byGameType">;
  }>;
};

export type StatisticsMatchItem = {
  match: StatisticsMatchReference;
  gameType: StatisticsGameType;
  wind: Wind;
  rank: number;
  rawScore: number;
  finalPoint: number;
  opponents: Array<{
    userId: UserId;
    userName: string;
    rank: number;
    finalPoint: number;
  }>;
};

export type StatisticsMatchPage =
  | {
      status: "ready";
      scope: StatisticsScope;
      generatedAt: IsoDateString;
      timeZone: "Asia/Tokyo";
      /** Ordered newest first by playedAt, sessionId, matchIndex, and matchId. */
      items: StatisticsMatchItem[];
      nextCursor: string | null;
    }
  | {
      status: "empty";
      scope: StatisticsScope;
      generatedAt: IsoDateString;
      timeZone: "Asia/Tokyo";
      items: [];
      nextCursor: null;
    }
  | {
      status: "uncomputed";
      scope: StatisticsScope;
      generatedAt: null;
      timeZone: "Asia/Tokyo";
      items: [];
      nextCursor: null;
    };

export type UserMatchStatistics = {
  id: OpaqueId;
  userId: UserId;
  userName: string;
  leagueId: LeagueId;
  leagueName: string;
  seasonId: SeasonId;
  seasonName: string;
  sessionId: SessionId;
  sessionLabel: string | null;
  matchId: MatchId;
  matchIndex: number;
  playedAt: IsoDateString;
  gameType: StatisticsGameType;
  playerCount: 3 | 4;
  wind: Wind;
  rank: number;
  rawScore: number;
  finalPoint: number;
  chomboCount: number;
  opponents: Array<{
    userId: UserId;
    userName: string;
    rank: number;
    finalPoint: number;
  }>;
  updatedAt: IsoDateString;
};
