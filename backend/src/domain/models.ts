export type GameType = "sanma" | "yonma";
export type SeasonStatus = "active" | "archived";
export type ScopeType = "overall" | "league" | "season";
export type ScoreCalculation = "decimal" | "fiveDropSixUp" | "round" | "floor" | "ceil";
export type Wind = "east" | "south" | "west" | "north";

export type Rule = {
  id: string;
  name: string;
  description: string;
  gameType: GameType;
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
  scoreCalculation: ScoreCalculation;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  username: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type LeagueMember = {
  id: string;
  userId: string;
  userName: string;
};

export type LeagueSummary = {
  id: string;
  name: string;
  rule: {
    id: string;
    name: string;
  };
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

export type RecordHolder = {
  value: number;
  userId: string;
  userName: string;
};

export type LeagueDetail = {
  id: string;
  name: string;
  rule: {
    id: string;
    name: string;
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

export type Session = {
  id: string;
  leagueId: string;
  seasonId: string;
  startedAt: string;
  endedAt: string | null;
  members: SeasonMember[];
  memberCount: number;
  totalMatchCount: number;
  tableLabel: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type MatchResult = {
  userId: string;
  userName: string;
  wind: Wind;
  rank: number;
  rawScore: number;
  point: number;
};

export type Match = {
  id: string;
  leagueId: string;
  seasonId: string;
  sessionId: string;
  matchIndex: number;
  playedAt: string;
  results: MatchResult[];
  createdAt: string;
  updatedAt: string;
};

export type UserStats = {
  id: string;
  userId: string;
  userName: string;
  scopeType: ScopeType;
  leagueId: string | null;
  seasonId: string | null;
  leagueName: string | null;
  seasonName: string | null;
  totalPoints: number;
  totalMatchCount: number;
  averageRank: number;
  currentRank: number | null;
  firstCount: number;
  secondCount: number;
  thirdCount: number;
  fourthCount: number | null;
  firstRate: number;
  secondRate: number;
  thirdRate: number;
  fourthRate: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  averageScore: number | null;
  winStreak: number | null;
  loseStreak: number | null;
  createdAt: string;
  updatedAt: string;
};

export type JoiningSeason = {
  leagueId: string;
  leagueName: string;
  seasonId: string;
  seasonName: string;
};

export type CreateLeagueInput = {
  name: string;
  ruleId: string;
  memberUserIds: string[];
};

export type UpdateLeagueInput = {
  name?: string;
};

export type CreateSeasonInput = {
  name: string;
  memberUserIds: string[];
  status?: SeasonStatus;
};

export type UpdateSeasonInput = {
  name?: string;
  status?: SeasonStatus;
};

export type CreateSessionInput = {
  startedAt: string;
  endedAt?: string | null;
  memberUserIds: string[];
  tableLabel?: string | null;
  createdBy: string;
};

export type UpdateSessionInput = {
  endedAt?: string | null;
  tableLabel?: string | null;
};

export type CreateMatchInput = {
  playedAt: string;
  results: Array<{
    userId: string;
    wind: Wind;
    rank: number;
    rawScore: number;
  }>;
};

export type UpdateMatchInput = {
  playedAt?: string;
  results?: Array<{
    userId: string;
    wind: Wind;
    rank: number;
    rawScore: number;
  }>;
};
