import type { CreateLeagueInput, LeagueDetail, LeagueMember, LeagueSummary, Rule, UpdateLeagueInput } from "@/domain/models.js";

export interface LeagueRepository {
  list(memberUserId?: string): Promise<LeagueSummary[]>;
  get(leagueId: string): Promise<LeagueDetail>;
  create(input: CreateLeagueInput, rule: Rule): Promise<LeagueDetail>;
  update(leagueId: string, input: UpdateLeagueInput): Promise<LeagueDetail>;
  delete(leagueId: string): Promise<void>;
  listMembers(leagueId: string): Promise<LeagueMember[]>;
  setActiveSeason(leagueId: string, seasonId: string | null, seasonName: string | null): Promise<void>;
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
