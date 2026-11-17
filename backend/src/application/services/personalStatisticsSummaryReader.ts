import type { LeagueRepository } from "@/domain/league/repository.js";
import type { SeasonRepository } from "@/domain/season/repository.js";
import type {
  PersonalStatisticsResult,
  PersonalStatisticsSummary,
  PersonalStatisticsSnapshot,
  PersonalStatisticsSnapshotValues,
  StatisticsScope,
  StatisticsSummaryQuery,
  UserMatchStatistics,
} from "@/domain/statistics/types.js";
import type { UserMatchStatisticsRepository } from "@/domain/statistics/repository.js";
import { buildPersonalStatisticsSnapshot } from "@/domain/statistics/snapshot-builder.js";
import { StatisticsTargetAccessService } from "@/application/services/statisticsTargetAccessService.js";
import type { UserStatsRepository } from "@/domain/user/repository.js";
import type { UserStatsUpsertData } from "@/domain/user/types.js";
import { NotFoundError } from "@/domain/shared/errors.js";
import { YAKUMAN_KINDS } from "@/domain/match/yakuman.js";

const TIME_ZONE = "Asia/Tokyo" as const;

const toScope = (query: StatisticsSummaryQuery): StatisticsScope => {
  const filters = {
    ...(query.from === undefined ? {} : { from: query.from }),
    ...(query.to === undefined ? {} : { to: query.to }),
    ...(query.gameType === undefined ? {} : { gameType: query.gameType }),
  };

  if (query.scopeType === "overall") {
    return { ...filters, scopeType: "overall" };
  }
  if (query.scopeType === "league") {
    return {
      ...filters,
      scopeType: "league",
      leagueId: query.leagueId,
    };
  }
  return {
    ...filters,
    scopeType: "season",
    leagueId: query.leagueId,
    seasonId: query.seasonId,
  };
};

const toStatsKey = (query: StatisticsSummaryQuery) => {
  if (query.scopeType === "overall") {
    return { userId: query.targetUserId, scopeType: query.scopeType };
  }
  if (query.scopeType === "league") {
    return {
      userId: query.targetUserId,
      scopeType: query.scopeType,
      leagueId: query.leagueId,
    };
  }
  return {
    userId: query.targetUserId,
    scopeType: query.scopeType,
    leagueId: query.leagueId,
    seasonId: query.seasonId,
  };
};

const hasDateFilter = (query: StatisticsSummaryQuery): boolean =>
  query.from !== undefined || query.to !== undefined;

const toFilteredSnapshot = (
  query: StatisticsSummaryQuery,
  matches: readonly UserMatchStatistics[],
  savedSnapshot: PersonalStatisticsSnapshot,
): PersonalStatisticsSnapshot => {
  return buildPersonalStatisticsSnapshot({
    targetUserId: query.targetUserId,
    scopeType: query.scopeType,
    matches,
    basicStats: toBasicStats(
      matches,
      savedSnapshot.all.currentStanding?.rank ?? null,
    ),
    currentStanding: null,
    persistedCurrentStanding: savedSnapshot.all.currentStanding,
  });
};

const selectSnapshotValues = (
  snapshot: PersonalStatisticsSnapshot,
  gameType: StatisticsSummaryQuery["gameType"],
): PersonalStatisticsSnapshotValues => {
  if (gameType === undefined || gameType === "all") {
    return snapshot.all;
  }

  const format = snapshot.all.byGameType.find(
    (item) => item.gameType === gameType,
  );
  const slice = snapshot.byGameType.find((item) => item.gameType === gameType);
  if (format === undefined || slice === undefined) {
    throw new TypeError(`personal statistics snapshot is missing ${gameType}`);
  }

  return { ...slice.summary, byGameType: [format] };
};

const toBasicStats = (
  matches: readonly UserMatchStatistics[],
  currentRank: number | null,
): Pick<
  UserStatsUpsertData,
  | "totalPoints"
  | "totalMatchCount"
  | "chomboCount"
  | "currentRank"
  | "firstCount"
  | "secondCount"
  | "thirdCount"
  | "fourthCount"
> => ({
  totalPoints: Number(
    matches.reduce((sum, match) => sum + match.finalPoint, 0).toFixed(1),
  ),
  totalMatchCount: matches.length,
  chomboCount: matches.reduce((sum, match) => sum + match.chomboCount, 0),
  currentRank,
  firstCount: matches.filter((match) => match.rank === 1).length,
  secondCount: matches.filter((match) => match.rank === 2).length,
  thirdCount: matches.filter((match) => match.rank === 3).length,
  fourthCount: matches.some((match) => match.gameType === "yonma")
    ? matches.filter((match) => match.rank === 4).length
    : null,
});

export class PersonalStatisticsSummaryReader {
  constructor(
    private readonly accessService: Pick<
      StatisticsTargetAccessService,
      "assertAllowed"
    >,
    private readonly userStatsRepository: Pick<
      UserStatsRepository,
      "getWithPersonalStatistics"
    >,
    private readonly projectionRepository: Pick<
      UserMatchStatisticsRepository,
      "listForScope"
    >,
    private readonly leagueRepository: Pick<LeagueRepository, "exists"> &
      Partial<Pick<LeagueRepository, "getRule">>,
    private readonly seasonRepository: Pick<SeasonRepository, "exists">,
  ) {}

  async getSummary(
    query: StatisticsSummaryQuery,
  ): Promise<PersonalStatisticsResult> {
    await this.accessService.assertAllowed(query);
    await this.assertScopeExists(query);

    const statsRecord =
      await this.userStatsRepository.getWithPersonalStatistics(
        toStatsKey(query),
      );
    if (
      statsRecord === null ||
      statsRecord.personalStatisticsVersion < 1 ||
      statsRecord.personalStatisticsSnapshot === null
    ) {
      return {
        status: "uncomputed",
        scope: toScope(query),
        generatedAt: null,
        timeZone: TIME_ZONE,
      };
    }

    const matches = hasDateFilter(query)
      ? await this.projectionRepository.listForScope({
          ...toScope(query),
          userId: query.targetUserId,
        })
      : null;
    const snapshot = matches
      ? toFilteredSnapshot(
          query,
          matches,
          statsRecord.personalStatisticsSnapshot,
        )
      : statsRecord.personalStatisticsSnapshot;
    const values = selectSnapshotValues(snapshot, query.gameType);
    const detailMatches =
      query.includePointBreakdown || query.includeYakumanCounts
        ? (matches ??
          (await this.projectionRepository
            .listForScope({ ...toScope(query), userId: query.targetUserId })
            .catch(() => null)))
        : null;
    const selectedMatches = detailMatches?.filter(
      (match) =>
        !query.gameType ||
        query.gameType === "all" ||
        match.gameType === query.gameType,
    );
    const consistentMatches =
      selectedMatches &&
      selectedMatches.length === values.totals.totalMatchCount &&
      Number(
        selectedMatches
          .reduce((sum, match) => sum + match.finalPoint, 0)
          .toFixed(1),
      ) === values.totals.totalPoints
        ? selectedMatches
        : null;
    const pointBreakdown = query.includePointBreakdown
      ? await this.getPointBreakdown(consistentMatches).catch(() => null)
      : undefined;
    const yakumanCounts = query.includeYakumanCounts
      ? consistentMatches === null
        ? null
        : YAKUMAN_KINDS.map((kind) => ({
            kind,
            count: consistentMatches.reduce(
              (count, match) =>
                count +
                (match.yakumanKinds ?? []).filter((item) => item === kind)
                  .length,
              0,
            ),
          }))
      : undefined;
    const scoreByGameType = snapshot.byGameType
      .filter(
        ({ gameType }) =>
          query.gameType === undefined ||
          query.gameType === "all" ||
          query.gameType === gameType,
      )
      .map(({ gameType, summary }) => ({
        gameType,
        rawScore: summary.rawScore,
        finalPoint: summary.finalPoint,
      }));

    return {
      status: values.totals.totalMatchCount === 0 ? "empty" : "ready",
      scope: toScope(query),
      generatedAt: statsRecord.stats.updatedAt,
      timeZone: TIME_ZONE,
      ...values,
      scoreByGameType,
      pointBreakdown,
      yakumanCounts,
    };
  }

  private async getPointBreakdown(
    selected: readonly UserMatchStatistics[] | null,
  ): Promise<PersonalStatisticsSummary["pointBreakdown"]> {
    if (!this.leagueRepository.getRule || selected === null) return null;
    const leagueIds = [...new Set(selected.map((match) => match.leagueId))];
    const rules = new Map(
      await Promise.all(
        leagueIds.map(
          async (id) => [id, await this.leagueRepository.getRule!(id)] as const,
        ),
      ),
    );
    let rawPoint = 0;
    let rankPoint = 0;
    let chomboPenalty = 0;
    for (const match of selected) {
      const rule = rules.get(match.leagueId);
      if (!rule) return null;
      const raw = (match.rawScore - rule.oka.returnPoints) / 1000;
      const penalty = -match.chomboCount * rule.chomboPenaltyPoints;
      rawPoint += raw;
      chomboPenalty += penalty;
      // The recorded final point includes the per-match rounding and tie handling.
      rankPoint += match.finalPoint - raw - penalty;
    }
    const round = (value: number) => Number(value.toFixed(1));
    return {
      rawPoint: round(rawPoint),
      rankPoint: round(rankPoint),
      chomboPenalty: round(chomboPenalty),
    };
  }

  private async assertScopeExists(
    query: StatisticsSummaryQuery,
  ): Promise<void> {
    if (query.scopeType === "league") {
      if (!(await this.leagueRepository.exists(query.leagueId))) {
        throw new NotFoundError("league not found", {
          leagueId: query.leagueId,
        });
      }
    } else if (query.scopeType === "season") {
      if (
        !(await this.seasonRepository.exists(query.leagueId, query.seasonId))
      ) {
        throw new NotFoundError("season not found", {
          leagueId: query.leagueId,
          seasonId: query.seasonId,
        });
      }
    }
  }
}
