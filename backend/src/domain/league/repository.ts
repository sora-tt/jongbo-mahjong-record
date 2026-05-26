import type {
  LeagueDetail,
  LeagueMember,
  LeagueSummary,
} from "@/domain/league/types.js";

export type LeagueRule = {
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

export type CreateLeagueInput = {
  name: string;
  rule: LeagueRule;
  memberUserIds: string[];
};

export type UpdateLeagueInput = {
  name?: string;
  rule?: LeagueRule;
  memberUserIds?: string[];
};

export interface LeagueRepository {
  list(memberUserId?: string): Promise<LeagueSummary[]>;
  get(leagueId: string): Promise<LeagueDetail>;
  getRule(leagueId: string): Promise<LeagueRule>;
  create(input: CreateLeagueInput): Promise<LeagueDetail>;
  update(leagueId: string, input: UpdateLeagueInput): Promise<LeagueDetail>;
  delete(leagueId: string): Promise<void>;
  listMembers(leagueId: string): Promise<LeagueMember[]>;
  setActiveSeason(
    leagueId: string,
    seasonId: string | null,
    seasonName: string | null,
  ): Promise<void>;
  updateLeagueStatistics(params: {
    leagueId: string;
    totalMatchCount: number;
    leagueRecords: {
      winStreak: { value: number; userId: string; userName: string } | null;
      loseStreak: { value: number; userId: string; userName: string } | null;
      highestScore: { value: number; userId: string; userName: string } | null;
      lowestScore: { value: number; userId: string; userName: string } | null;
    } | null;
  }): Promise<void>;
}
