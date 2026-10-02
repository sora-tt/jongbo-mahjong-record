import type {
  StatisticsMatchPage,
  StatisticsScope,
  UserMatchStatistics,
} from "@/domain/statistics/types.js";

export interface UserMatchStatisticsRepository {
  /** Replaces every projection in a season with the supplied current rows. */
  replaceSeason(input: {
    leagueId: string;
    seasonId: string;
    rows: UserMatchStatistics[];
  }): Promise<void>;

  deleteSeason(leagueId: string, seasonId: string): Promise<void>;

  deleteLeague(leagueId: string): Promise<void>;

  listForScope(
    query: StatisticsScope & { userId: string },
  ): Promise<UserMatchStatistics[]>;

  listPage(
    query: StatisticsScope & {
      userId: string;
      limit: number;
      cursor?: string;
    },
  ): Promise<StatisticsMatchPage>;
}
