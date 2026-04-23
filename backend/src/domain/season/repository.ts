import type {
  PointProgression,
  SeasonDetail,
  SeasonMember,
  SeasonSummary,
  Standing,
} from "@/domain/season/types.js";
import type { SeasonStatus } from "@/domain/shared/types.js";

export type CreateSeasonInput = {
  name: string;
  memberUserIds: string[];
  status?: SeasonStatus;
};

export type UpdateSeasonInput = {
  name?: string;
  status?: SeasonStatus;
};

export interface SeasonRepository {
  list(leagueId: string): Promise<SeasonSummary[]>;
  get(leagueId: string, seasonId: string): Promise<SeasonDetail>;
  create(
    leagueId: string,
    input: CreateSeasonInput,
    members: SeasonMember[],
  ): Promise<SeasonDetail>;
  update(
    leagueId: string,
    seasonId: string,
    input: UpdateSeasonInput,
  ): Promise<SeasonDetail>;
  delete(leagueId: string, seasonId: string): Promise<void>;
  listMembers(leagueId: string, seasonId: string): Promise<SeasonMember[]>;
  updateStatistics(params: {
    leagueId: string;
    seasonId: string;
    totalMatchCount: number;
    standings: Standing[];
    pointProgressions: PointProgression[];
    seasonRecords: {
      highestScore: { value: number; userId: string; userName: string } | null;
      avoidLastRate: { value: number; userId: string; userName: string } | null;
      top2Rate: { value: number; userId: string; userName: string } | null;
    } | null;
  }): Promise<void>;
  findActiveSeason(leagueId: string): Promise<SeasonSummary | null>;
}
