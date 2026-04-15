import {
  buildLeagueRecords,
  buildPointProgressions,
  buildSeasonRecords,
  buildStandings,
  buildUserStats,
} from "@/domain/shared/aggregation.js";
import type { MatchResult } from "@/domain/match/types.js";
import type { MatchRepository } from "@/domain/match/repository.js";
import type { LeagueRepository } from "@/domain/league/repository.js";
import type { SeasonMember } from "@/domain/season/types.js";
import type { SeasonRepository } from "@/domain/season/repository.js";
import type { SessionRepository } from "@/domain/session/repository.js";
import type { ScopeType } from "@/domain/shared/types.js";
import type { UserStatsRepository } from "@/domain/user/repository.js";

export class StatsRebuilder {
  constructor(
    private readonly leagueRepository: LeagueRepository,
    private readonly seasonRepository: SeasonRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly matchRepository: MatchRepository,
    private readonly userStatsRepository: UserStatsRepository,
  ) {}

  async rebuildSeason(leagueId: string, seasonId: string) {
    const season = await this.seasonRepository.get(leagueId, seasonId);
    const sessions = await this.sessionRepository.list(leagueId, seasonId);
    const seasonMatches = await this.matchRepository.listBySeason(
      leagueId,
      seasonId,
    );
    const standings = buildStandings(season.members, seasonMatches);
    const pointProgressions = buildPointProgressions(
      season.members,
      seasonMatches,
    );
    const seasonRecords = buildSeasonRecords(season.members, seasonMatches);

    await this.seasonRepository.updateStatistics({
      leagueId,
      seasonId,
      totalMatchCount: seasonMatches.length,
      standings,
      pointProgressions,
      seasonRecords,
    });

    await Promise.all(
      sessions.map(async (session) => {
        const sessionMatches = await this.matchRepository.list(
          leagueId,
          seasonId,
          session.id,
        );
        await this.sessionRepository.setTotalMatchCount(
          leagueId,
          seasonId,
          session.id,
          sessionMatches.length,
        );
      }),
    );

    await this.rebuildUserStats("season", {
      leagueId,
      seasonId,
      leagueName: (await this.leagueRepository.get(leagueId)).name,
      seasonName: season.name,
      members: season.members,
      standings,
      resultsByUser: collectUserResults(seasonMatches),
      playerCount: season.members.length,
    });

    await this.rebuildLeague(leagueId);
  }

  async rebuildLeague(leagueId: string) {
    const league = await this.leagueRepository.get(leagueId);
    const seasons = await this.seasonRepository.list(leagueId);
    const activeSeason =
      seasons.find((season) => season.status === "active") ?? null;
    await this.leagueRepository.setActiveSeason(
      leagueId,
      activeSeason?.id ?? null,
      activeSeason?.name ?? null,
    );

    const leagueMatches = await this.matchRepository.listByLeague(leagueId);
    await this.leagueRepository.updateLeagueStatistics({
      leagueId,
      totalMatchCount: leagueMatches.length,
      leagueRecords: buildLeagueRecords(leagueMatches),
    });

    const leagueResultsByUser = collectUserResults(leagueMatches);
    const standings = activeSeason
      ? (await this.seasonRepository.get(leagueId, activeSeason.id)).standings
      : [];
    await this.rebuildUserStats("league", {
      leagueId,
      seasonId: null,
      leagueName: league.name,
      seasonName: null,
      members: league.members.map((member) => ({
        userId: member.userId,
        userName: member.userName,
      })),
      standings,
      resultsByUser: leagueResultsByUser,
      playerCount: league.members.length,
    });

    await this.rebuildOverallStatsForUsers(league.members);
  }

  private async rebuildOverallStatsForUsers(members: SeasonMember[]) {
    const allMatches = await this.matchRepository.listAll();
    const resultsByUser = collectUserResults(allMatches);

    await Promise.all(
      members.map(async (member) => {
        const results = resultsByUser.get(member.userId) ?? [];
        const stats = buildUserStats({
          scopeType: "overall",
          userId: member.userId,
          userName: member.userName,
          leagueId: null,
          seasonId: null,
          leagueName: null,
          seasonName: null,
          matchCount: results.length,
          currentRank: null,
          results,
          playerCount: inferPlayerCount(results),
        });

        await this.userStatsRepository.upsert(
          {
            userId: member.userId,
            scopeType: "overall",
            leagueId: null,
            seasonId: null,
          },
          stats,
        );
      }),
    );
  }

  private async rebuildUserStats(
    scopeType: ScopeType,
    params: {
      leagueId: string;
      seasonId: string | null;
      leagueName: string;
      seasonName: string | null;
      members: SeasonMember[];
      standings: Array<{ rank: number; userId: string }>;
      resultsByUser: Map<string, MatchResult[]>;
      playerCount: number;
    },
  ) {
    const rankMap = new Map(
      params.standings.map((standing) => [standing.userId, standing.rank]),
    );

    await Promise.all(
      params.members.map(async (member) => {
        const results = params.resultsByUser.get(member.userId) ?? [];
        const stats = buildUserStats({
          scopeType,
          userId: member.userId,
          userName: member.userName,
          leagueId: params.leagueId,
          seasonId: params.seasonId,
          leagueName: params.leagueName,
          seasonName: params.seasonName,
          matchCount: results.length,
          currentRank: rankMap.get(member.userId) ?? null,
          results,
          playerCount: params.playerCount,
        });

        await this.userStatsRepository.upsert(
          {
            userId: member.userId,
            scopeType,
            leagueId: params.leagueId,
            seasonId: params.seasonId,
          },
          stats,
        );
      }),
    );

    if (scopeType === "season" && params.seasonId) {
      await this.userStatsRepository.deleteMissingSeasonStats(
        params.leagueId,
        params.seasonId,
        params.members.map((member) => member.userId),
      );
    }
  }
}

const collectUserResults = (matches: Array<{ results: MatchResult[] }>) => {
  const result = new Map<string, MatchResult[]>();
  matches.forEach((match) => {
    match.results.forEach((row) => {
      const current = result.get(row.userId) ?? [];
      current.push(row);
      result.set(row.userId, current);
    });
  });
  return result;
};

const inferPlayerCount = (results: MatchResult[]) => {
  const fourthCount = results.filter((result) => result.rank === 4).length;
  return fourthCount > 0 ? 4 : 3;
};
