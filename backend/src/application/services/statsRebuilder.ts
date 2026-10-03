import {
  buildLeagueRecords,
  buildPointProgressions,
  buildSeasonRecords,
  buildStandings,
  buildUserStats,
  sortMatches,
} from "@/domain/shared/aggregation.js";
import type { Match, MatchResult } from "@/domain/match/types.js";
import type { MatchRepository } from "@/domain/match/repository.js";
import type { LeagueRepository } from "@/domain/league/repository.js";
import type { SeasonMember } from "@/domain/season/types.js";
import type { SeasonRepository } from "@/domain/season/repository.js";
import type { SessionRepository } from "@/domain/session/repository.js";
import { asOpaqueId, type ScopeType } from "@/domain/shared/types.js";
import { buildUserMatchStatisticsProjections } from "@/domain/statistics/projection-builder.js";
import type {
  UserMatchStatisticsDraft,
  UserMatchStatisticsRepository,
} from "@/domain/statistics/repository.js";
import { buildPersonalStatisticsSnapshot } from "@/domain/statistics/snapshot-builder.js";
import type { UserStatsRepository } from "@/domain/user/repository.js";

export type RebuildScope =
  | { type: "session"; leagueId: string; seasonId: string; sessionId: string }
  | { type: "season"; leagueId: string; seasonId: string }
  | { type: "league"; leagueId: string }
  | { type: "overall" };

export type RebuildReport = {
  scope: RebuildScope;
  matchCount: number;
  userCount: number;
};

export class StatsRebuilder {
  constructor(
    private readonly leagueRepository: LeagueRepository,
    private readonly seasonRepository: SeasonRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly matchRepository: MatchRepository,
    private readonly userStatsRepository: UserStatsRepository,
    private readonly userMatchStatisticsRepository: UserMatchStatisticsRepository,
  ) {}

  async rebuildSession(
    leagueId: string,
    seasonId: string,
    sessionId: string,
  ): Promise<RebuildReport> {
    await this.markUncomputedScopes(
      seasonLeagueOverallScopes(leagueId, seasonId),
    );
    const matches = sortMatches(
      await this.matchRepository.list(leagueId, seasonId, sessionId),
    );
    await this.sessionRepository.setTotalMatchCount(
      leagueId,
      seasonId,
      sessionId,
      matches.length,
    );
    await this.rebuildSeasonPhases(leagueId, seasonId);
    return {
      scope: { type: "session", leagueId, seasonId, sessionId },
      matchCount: matches.length,
      userCount: new Set(
        matches.flatMap((match) =>
          match.results.map((result) => result.userId),
        ),
      ).size,
    };
  }

  async rebuildSeason(
    leagueId: string,
    seasonId: string,
  ): Promise<RebuildReport> {
    await this.markUncomputedScopes(
      seasonLeagueOverallScopes(leagueId, seasonId),
    );
    return this.rebuildSeasonPhases(leagueId, seasonId);
  }

  private async rebuildSeasonPhases(
    leagueId: string,
    seasonId: string,
  ): Promise<RebuildReport> {
    const [league, season, sessions, rule, seasonMatches] = await Promise.all([
      this.leagueRepository.get(leagueId),
      this.seasonRepository.get(leagueId, seasonId),
      this.sessionRepository.list(leagueId, seasonId),
      this.leagueRepository.getRule(leagueId),
      this.matchRepository.listBySeason(leagueId, seasonId),
    ]);
    const orderedMatches = sortMatches(seasonMatches);
    const sessionById = new Map(
      sessions.map((session) => [session.id, session]),
    );
    const projectionRows = orderedMatches.flatMap((match) => {
      const session = sessionById.get(match.sessionId);
      if (!session) {
        throw new TypeError(
          `statistics projection cannot find session ${match.sessionId}`,
        );
      }
      return buildUserMatchStatisticsProjections({
        match,
        league: { id: league.id, name: league.name },
        season: { id: season.id, name: season.name },
        session: { id: session.id, label: session.tableLabel },
      });
    });
    await this.replaceSeasonProjection(leagueId, seasonId, projectionRows);

    const standings = buildStandings(
      season.members,
      orderedMatches,
      rule.gameType,
    );
    const pointProgressions = buildPointProgressions(
      season.members,
      orderedMatches,
    );
    const seasonRecords = buildSeasonRecords(
      season.members,
      orderedMatches,
      rule.gameType,
    );

    await this.seasonRepository.updateStatistics({
      leagueId,
      seasonId,
      totalMatchCount: orderedMatches.length,
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

    const resultsByUser = collectUserResults(orderedMatches);
    const chomboCountByUserId = collectUserChomboCounts(orderedMatches);
    await this.rebuildUserStats("season", {
      leagueId,
      seasonId,
      leagueName: league.name,
      seasonName: season.name,
      members: season.members,
      standings,
      resultsByUser,
      chomboCountByUserId,
      playerCount: playerCountForGameType(rule.gameType),
      currentStanding: { source: "season", standings },
    });

    await this.rebuildLeagueScope(leagueId);
    await this.rebuildOverallScope();
    return {
      scope: { type: "season", leagueId, seasonId },
      matchCount: orderedMatches.length,
      userCount: resultsByUser.size,
    };
  }

  async rebuildLeague(leagueId: string): Promise<RebuildReport> {
    await this.markUncomputedScopes([
      {
        scopeType: "league",
        leagueId,
        seasonId: null,
      },
      { scopeType: "overall", leagueId: null, seasonId: null },
    ]);
    const report = await this.rebuildLeagueScope(leagueId);
    await this.rebuildOverallScope();
    return report;
  }

  private async rebuildLeagueScope(leagueId: string): Promise<RebuildReport> {
    const [league, seasons, rule, leagueMatches] = await Promise.all([
      this.leagueRepository.get(leagueId),
      this.seasonRepository.list(leagueId),
      this.leagueRepository.getRule(leagueId),
      this.matchRepository.listByLeague(leagueId),
    ]);
    const activeSeason =
      seasons.find((season) => season.status === "active") ?? null;
    await this.leagueRepository.setActiveSeason(
      leagueId,
      activeSeason?.id ?? null,
      activeSeason?.name ?? null,
    );

    const orderedMatches = sortMatches(leagueMatches);
    await this.leagueRepository.updateLeagueStatistics({
      leagueId,
      totalMatchCount: orderedMatches.length,
      leagueRecords: buildLeagueRecords(orderedMatches),
    });

    const activeSeasonData = activeSeason
      ? await this.seasonRepository.get(leagueId, activeSeason.id)
      : null;
    const activeStandings =
      activeSeasonData && activeSeason
        ? buildStandings(
            activeSeasonData.members,
            sortMatches(
              await this.matchRepository.listBySeason(
                leagueId,
                activeSeason.id,
              ),
            ),
            rule.gameType,
          )
        : [];
    const resultsByUser = collectUserResults(orderedMatches);
    const chomboCountByUserId = collectUserChomboCounts(orderedMatches);
    await this.rebuildUserStats("league", {
      leagueId,
      seasonId: null,
      leagueName: league.name,
      seasonName: null,
      members: league.members,
      standings: activeStandings,
      resultsByUser,
      chomboCountByUserId,
      playerCount: playerCountForGameType(rule.gameType),
      currentStanding: activeSeasonData
        ? { source: "activeSeason", standings: activeStandings }
        : null,
    });

    return {
      scope: { type: "league", leagueId },
      matchCount: orderedMatches.length,
      userCount: resultsByUser.size,
    };
  }

  async rebuildOverall(): Promise<RebuildReport> {
    await this.markUncomputedScopes([
      { scopeType: "overall", leagueId: null, seasonId: null },
    ]);
    return this.rebuildOverallScope();
  }

  private async rebuildOverallScope(): Promise<RebuildReport> {
    const [allMatches, currentMembers] = await Promise.all([
      this.matchRepository.listAll(),
      this.leagueRepository.listAllMembers(),
    ]);
    const orderedMatches = sortMatches(allMatches);
    const resultsByUser = collectUserResults(orderedMatches);
    const chomboCountByUserId = collectUserChomboCounts(orderedMatches);
    const playerCountByUser = collectPlayerCounts(orderedMatches);
    const members = mergeMembers(currentMembers, resultsByUser);

    await this.rebuildUserStats("overall", {
      leagueId: null,
      seasonId: null,
      leagueName: null,
      seasonName: null,
      members,
      standings: [],
      resultsByUser,
      chomboCountByUserId,
      playerCount: 4,
      playerCountByUser,
      currentStanding: null,
    });

    return {
      scope: { type: "overall" },
      matchCount: orderedMatches.length,
      userCount: resultsByUser.size,
    };
  }

  async clearSeasonStats(leagueId: string, seasonId: string): Promise<void> {
    await this.userStatsRepository.deleteMissingScopeStats({
      scopeType: "season",
      leagueId,
      seasonId,
      keepUserIds: [],
    });
  }

  async clearLeagueStats(leagueId: string): Promise<void> {
    await this.userStatsRepository.deleteStatsForLeague(leagueId);
  }

  private async markUncomputedScopes(
    scopes: Array<{
      scopeType: ScopeType;
      leagueId: string | null;
      seasonId: string | null;
    }>,
  ): Promise<void> {
    await this.userStatsRepository.markScopesUncomputed(scopes);
  }

  private async replaceSeasonProjection(
    leagueId: string,
    seasonId: string,
    rows: UserMatchStatisticsDraft[],
  ): Promise<void> {
    await this.userMatchStatisticsRepository.replaceSeason({
      leagueId,
      seasonId,
      rows,
    });
  }

  private async rebuildUserStats(
    scopeType: ScopeType,
    params: {
      leagueId: string | null;
      seasonId: string | null;
      leagueName: string | null;
      seasonName: string | null;
      members: SeasonMember[];
      standings: Array<{
        rank: number;
        userId: string;
        totalPoints: number;
      }>;
      resultsByUser: Map<string, MatchResult[]>;
      chomboCountByUserId: Map<string, number>;
      playerCount: number;
      playerCountByUser?: Map<string, number>;
      currentStanding: {
        source: "season" | "activeSeason";
        standings: Array<{
          rank: number;
          userId: string;
          totalPoints: number;
        }>;
      } | null;
    },
  ) {
    const rankMap = new Map(
      params.standings.map((standing) => [standing.userId, standing.rank]),
    );
    const members = mergeMembers(params.members, params.resultsByUser);

    const prepared: Array<{
      member: SeasonMember;
      stats: ReturnType<typeof buildUserStats>;
      personalStatisticsSnapshot: ReturnType<
        typeof buildPersonalStatisticsSnapshot
      >;
    }> = [];
    for (const memberChunk of chunk(members, 400)) {
      const preparedChunk = await Promise.all(
        memberChunk.map(async (member) => {
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
            chomboCount: params.chomboCountByUserId.get(member.userId) ?? 0,
            currentRank: rankMap.get(member.userId) ?? null,
            results,
            playerCount:
              params.playerCountByUser?.get(member.userId) ??
              params.playerCount,
          });
          const projections =
            await this.userMatchStatisticsRepository.listForScope(
              statisticsScopeQuery(scopeType, member.userId, params),
            );
          const personalStatisticsSnapshot = buildPersonalStatisticsSnapshot({
            targetUserId: asOpaqueId(member.userId),
            scopeType,
            matches: projections,
            basicStats: stats,
            currentStanding: params.currentStanding,
          });
          return { member, stats, personalStatisticsSnapshot };
        }),
      );
      prepared.push(...preparedChunk);
    }

    await this.userStatsRepository.deleteMissingScopeStats({
      scopeType,
      leagueId: params.leagueId,
      seasonId: params.seasonId,
      keepUserIds: members.map((member) => member.userId),
    });

    try {
      for (const preparedChunk of chunk(prepared, 400)) {
        const publishResults = await Promise.allSettled(
          preparedChunk.map(({ member, stats, personalStatisticsSnapshot }) =>
            this.userStatsRepository.upsert(
              {
                userId: member.userId,
                scopeType,
                leagueId: params.leagueId,
                seasonId: params.seasonId,
              },
              {
                ...stats,
                personalStatisticsVersion: 1,
                personalStatisticsSnapshot,
              },
            ),
          ),
        );
        const failedPublish = publishResults.find(
          (result) => result.status === "rejected",
        );
        if (failedPublish?.status === "rejected") {
          throw failedPublish.reason;
        }
      }
    } catch (error) {
      try {
        await this.userStatsRepository.markScopesUncomputed([
          {
            scopeType,
            leagueId: params.leagueId,
            seasonId: params.seasonId,
          },
        ]);
      } catch (invalidationError) {
        throw new AggregateError(
          [error, invalidationError],
          "failed to publish and invalidate personal statistics scope",
        );
      }
      throw error;
    }
  }
}

const collectUserResults = (matches: Match[]) => {
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

const collectUserChomboCounts = (matches: Match[]) => {
  const result = new Map<string, number>();
  matches.forEach((match) => {
    match.chomboEvents.forEach(({ offenderUserId }) => {
      result.set(offenderUserId, (result.get(offenderUserId) ?? 0) + 1);
    });
  });
  return result;
};

const collectPlayerCounts = (matches: Match[]) => {
  const result = new Map<string, number>();
  matches.forEach((match) => {
    match.results.forEach((row) => {
      result.set(
        row.userId,
        Math.max(result.get(row.userId) ?? 0, match.results.length),
      );
    });
  });
  return result;
};

const mergeMembers = (
  members: SeasonMember[],
  resultsByUser: Map<string, MatchResult[]>,
): SeasonMember[] => {
  const merged = new Map<string, SeasonMember>(
    members.map((member) => [member.userId, member]),
  );
  resultsByUser.forEach((results, userId) => {
    if (!merged.has(userId) && results[0]) {
      merged.set(userId, {
        userId: results[0].userId,
        userName: results[0].userName,
      });
    }
  });
  return [...merged.values()];
};

const playerCountForGameType = (gameType: "sanma" | "yonma") =>
  gameType === "sanma" ? 3 : 4;

const seasonLeagueOverallScopes = (leagueId: string, seasonId: string) => [
  { scopeType: "season" as const, leagueId, seasonId },
  { scopeType: "league" as const, leagueId, seasonId: null },
  { scopeType: "overall" as const, leagueId: null, seasonId: null },
];

const statisticsScopeQuery = (
  scopeType: ScopeType,
  userId: string,
  params: { leagueId: string | null; seasonId: string | null },
) => {
  if (scopeType === "overall") {
    return { scopeType: "overall" as const, userId: asOpaqueId(userId) };
  }
  if (scopeType === "league") {
    if (params.leagueId === null) {
      throw new TypeError("league statistics require a league ID");
    }
    return {
      scopeType: "league" as const,
      leagueId: asOpaqueId(params.leagueId),
      userId: asOpaqueId(userId),
    };
  }
  if (params.leagueId === null || params.seasonId === null) {
    throw new TypeError("season statistics require league and season IDs");
  }
  return {
    scopeType: "season" as const,
    leagueId: asOpaqueId(params.leagueId),
    seasonId: asOpaqueId(params.seasonId),
    userId: asOpaqueId(userId),
  };
};

const chunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};
