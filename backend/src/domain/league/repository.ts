import type {
  LeagueDetail,
  LeagueMember,
  LeagueSummary,
} from "@/domain/league/types.js";
import type { Rule } from "@/domain/rule/types.js";

export type LeagueRule = Pick<Rule, "gameType" | "uma" | "oka">;

export type CreateLeagueInput = {
  name: string;
  ruleId: string;
  memberUserIds: string[];
};

export type UpdateLeagueInput = {
  name?: string;
};

export interface LeagueRepository {
  list(memberUserId?: string): Promise<LeagueSummary[]>;
  get(leagueId: string): Promise<LeagueDetail>;
  getRule(leagueId: string): Promise<LeagueRule>;
  create(input: CreateLeagueInput, rule: Rule): Promise<LeagueDetail>;
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
