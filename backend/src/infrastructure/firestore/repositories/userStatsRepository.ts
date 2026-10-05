import { Timestamp, type Firestore } from "firebase-admin/firestore";
import { z } from "zod";
import type {
  UserStats,
  UserStatsUpsertData,
  UserStatsWithPersonalStatistics,
} from "@/domain/user/types.js";
import type { UserStatsRepository } from "@/domain/user/repository.js";
import {
  asIsoDateString,
  asOpaqueId,
  type ScopeType,
} from "@/domain/shared/types.js";
import type { PersonalStatisticsSnapshot } from "@/domain/statistics/types.js";
import {
  nullableNumber,
  nullableString,
  requiredNumber,
  requiredString,
  toIsoString,
} from "@/infrastructure/firestore/utils.js";
import { buildUserStatsId, type UserStatsKey } from "@/domain/user/statsKey.js";

const finiteNumberSchema = z.number().finite();
const nullableNumberSchema = finiteNumberSchema.nullable();
const gameTypeSchema = z.enum(["sanma", "yonma"]);

const uniqueGameTypes = <T extends { gameType: string }>(
  summaries: readonly T[],
) =>
  new Set(summaries.map((summary) => summary.gameType)).size ===
  summaries.length;

const containsBothGameTypes = <T extends { gameType: string }>(
  summaries: readonly T[],
) =>
  summaries.length === 2 &&
  summaries.some((summary) => summary.gameType === "sanma") &&
  summaries.some((summary) => summary.gameType === "yonma");

const rateCountSchema = z.object({
  count: finiteNumberSchema,
  denominator: finiteNumberSchema,
  rate: nullableNumberSchema,
});

const numericSummarySchema = z.object({
  matchCount: finiteNumberSchema,
  average: nullableNumberSchema,
  maximum: nullableNumberSchema,
  minimum: nullableNumberSchema,
  median: nullableNumberSchema,
  populationStandardDeviation: nullableNumberSchema,
});

const formatSummarySchema = z
  .object({
    gameType: gameTypeSchema,
    matchCount: finiteNumberSchema,
    totalPoints: finiteNumberSchema,
    averageFinalPoint: nullableNumberSchema,
    averageRank: nullableNumberSchema,
    ranks: z
      .array(
        z.object({
          rank: finiteNumberSchema,
          count: finiteNumberSchema,
          rate: nullableNumberSchema,
        }),
      )
      .max(4),
    topRate: nullableNumberSchema,
    topTwoRate: nullableNumberSchema,
    topThreeRate: nullableNumberSchema,
    lastRate: nullableNumberSchema,
    lastAvoidanceRate: nullableNumberSchema,
  })
  .superRefine((summary, context) => {
    if (summary.ranks.length > (summary.gameType === "sanma" ? 3 : 4)) {
      context.addIssue({
        code: "custom",
        message: "rank count exceeds the selected game type",
        path: ["ranks"],
      });
    }
  });

const formatSummaryListSchema = z
  .array(formatSummarySchema)
  .max(2)
  .superRefine((summaries, context) => {
    if (!uniqueGameTypes(summaries)) {
      context.addIssue({
        code: "custom",
        message: "game type summaries must be unique",
      });
    }
  });

const completeFormatSummaryListSchema = z
  .array(formatSummarySchema)
  .max(2)
  .superRefine((summaries, context) => {
    if (!containsBothGameTypes(summaries)) {
      context.addIssue({
        code: "custom",
        message: "must contain both sanma and yonma summaries",
      });
    }
  });

const matchReferenceSchema = z.object({
  matchId: z.string().transform((value) => asOpaqueId(value)),
  leagueId: z.string().transform((value) => asOpaqueId(value)),
  leagueName: z.string(),
  seasonId: z.string().transform((value) => asOpaqueId(value)),
  seasonName: z.string(),
  sessionId: z.string().transform((value) => asOpaqueId(value)),
  sessionLabel: z.string().nullable(),
  playedAt: z.string().transform((value) => asIsoDateString(value)),
});

const recordMatchReferenceSchema = matchReferenceSchema.extend({
  opponents: z
    .array(
      z.object({
        userId: z.string().transform((value) => asOpaqueId(value)),
        userName: z.string(),
        rank: finiteNumberSchema,
        finalPoint: finiteNumberSchema,
      }),
    )
    .max(3),
});

const recordHolderSchema = z
  .object({ value: finiteNumberSchema, match: recordMatchReferenceSchema })
  .nullable();

const snapshotValuesSchema = z.object({
  totals: z.object({
    totalMatchCount: finiteNumberSchema,
    sessionCount: finiteNumberSchema,
    totalPoints: finiteNumberSchema,
    averageFinalPoint: nullableNumberSchema,
    chomboCount: finiteNumberSchema,
  }),
  rawScore: numericSummarySchema,
  finalPoint: numericSummarySchema.extend({
    positive: rateCountSchema,
    negative: rateCountSchema,
    even: rateCountSchema,
  }),
  scoreByRank: z
    .array(
      z.object({
        gameType: gameTypeSchema,
        rank: finiteNumberSchema,
        matchCount: finiteNumberSchema,
        averageRawScore: nullableNumberSchema,
        averageFinalPoint: nullableNumberSchema,
      }),
    )
    .max(7),
  records: z.object({
    highestRawScore: recordHolderSchema,
    lowestRawScore: recordHolderSchema,
    highestFinalPoint: recordHolderSchema,
    lowestFinalPoint: recordHolderSchema,
  }),
  streaks: z
    .array(
      z.object({
        type: z.enum(["top", "last", "topTwo", "positive", "negative"]),
        currentCount: finiteNumberSchema,
        longestCount: finiteNumberSchema,
      }),
    )
    .max(5),
  recentResults: z
    .array(
      z.object({
        windowSize: z.union([z.literal(10), z.literal(20), z.literal(50)]),
        matchCount: finiteNumberSchema,
        totalPoints: finiteNumberSchema,
        byGameType: formatSummaryListSchema,
      }),
    )
    .max(3),
  currentStanding: z
    .object({
      rank: finiteNumberSchema,
      totalPoints: finiteNumberSchema,
      pointsBehindAbove: nullableNumberSchema,
      pointsAheadBelow: nullableNumberSchema,
      source: z.enum(["season", "activeSeason"]),
    })
    .nullable(),
});

const personalStatisticsSnapshotSchema = z.object({
  all: snapshotValuesSchema.extend({
    byGameType: completeFormatSummaryListSchema,
  }),
  byGameType: z
    .array(
      z.object({
        gameType: gameTypeSchema,
        summary: snapshotValuesSchema,
      }),
    )
    .max(2)
    .superRefine((summaries, context) => {
      if (!containsBothGameTypes(summaries)) {
        context.addIssue({
          code: "custom",
          message: "must contain both sanma and yonma summaries",
        });
      }
    }),
});

const mapPersonalStatisticsSnapshot = (
  value: unknown,
): PersonalStatisticsSnapshot =>
  personalStatisticsSnapshotSchema.parse(value) as PersonalStatisticsSnapshot;

export class FirestoreUserStatsRepository implements UserStatsRepository {
  constructor(private readonly db: Firestore) {}

  async get(params: {
    userId: string;
    scopeType: ScopeType;
    leagueId?: string;
    seasonId?: string;
  }): Promise<UserStats | null> {
    const document = await this.findDocument(params);
    return document ? this.map(document.id, document.data) : null;
  }

  async getWithPersonalStatistics(params: {
    userId: string;
    scopeType: ScopeType;
    leagueId?: string;
    seasonId?: string;
  }): Promise<UserStatsWithPersonalStatistics | null> {
    const document = await this.findDocument(params);
    return document
      ? this.mapWithPersonalStatistics(document.id, document.data)
      : null;
  }

  private async findDocument(params: {
    userId: string;
    scopeType: ScopeType;
    leagueId?: string;
    seasonId?: string;
  }): Promise<{ id: string; data: FirebaseFirestore.DocumentData } | null> {
    const key: UserStatsKey = {
      ...params,
      leagueId: params.leagueId ?? null,
      seasonId: params.seasonId ?? null,
    };
    const canonical = await this.db
      .collection("user_stats")
      .doc(buildUserStatsId(key))
      .get();
    if (canonical.exists) {
      return { id: canonical.id, data: canonical.data() ?? {} };
    }

    const legacy = await this.query(params).limit(1).get();
    const doc = legacy.docs[0];
    return doc ? { id: doc.id, data: doc.data() } : null;
  }

  async upsert(
    key: {
      userId: string;
      scopeType: ScopeType;
      leagueId: string | null;
      seasonId: string | null;
    },
    data: UserStatsUpsertData,
  ): Promise<string> {
    const personalStatisticsVersion = data.personalStatisticsVersion ?? 0;
    if (
      !Number.isSafeInteger(personalStatisticsVersion) ||
      personalStatisticsVersion < 0
    ) {
      throw new TypeError(
        "personalStatisticsVersion must be a non-negative integer",
      );
    }
    const personalStatisticsSnapshot =
      data.personalStatisticsSnapshot == null
        ? null
        : mapPersonalStatisticsSnapshot(data.personalStatisticsSnapshot);
    if (personalStatisticsVersion > 0 && personalStatisticsSnapshot === null) {
      throw new TypeError(
        "a ready personal statistics version requires a snapshot",
      );
    }

    const now = Timestamp.now();
    const statsId = buildUserStatsId(key);
    const payload = {
      user_id: data.userId,
      user_name: data.userName,
      scope_type: data.scopeType,
      league_id: data.leagueId,
      season_id: data.seasonId,
      league_name: data.leagueName,
      season_name: data.seasonName,
      total_points: data.totalPoints,
      total_match_count: data.totalMatchCount,
      chombo_count: data.chomboCount,
      average_rank: data.averageRank,
      current_rank: data.currentRank,
      first_count: data.firstCount,
      second_count: data.secondCount,
      third_count: data.thirdCount,
      fourth_count: data.fourthCount,
      first_rate: data.firstRate,
      second_rate: data.secondRate,
      third_rate: data.thirdRate,
      fourth_rate: data.fourthRate,
      highest_score: data.highestScore,
      lowest_score: data.lowestScore,
      average_score: data.averageScore,
      win_streak: data.winStreak,
      lose_streak: data.loseStreak,
      personal_statistics_version: personalStatisticsVersion,
      personal_statistics: personalStatisticsSnapshot,
      updated_at: now,
    };

    const ref = this.db.collection("user_stats").doc(statsId);
    const existing = await ref.get();
    await ref.set(
      existing.exists ? payload : { id: statsId, ...payload, created_at: now },
      { merge: existing.exists },
    );
    return statsId;
  }

  async markScopesUncomputed(
    scopes: Array<{
      scopeType: ScopeType;
      leagueId: string | null;
      seasonId: string | null;
    }>,
  ): Promise<void> {
    if (scopes.length === 0) return;
    const snapshots = await Promise.all(
      scopes.map(({ scopeType, leagueId, seasonId }) =>
        this.db
          .collection("user_stats")
          .where("scope_type", "==", scopeType)
          .where("league_id", "==", leagueId)
          .where("season_id", "==", seasonId)
          .get(),
      ),
    );
    const affectedDocs = new Map(
      snapshots.flatMap((snapshot) =>
        snapshot.docs.map((doc) => [doc.id, doc] as const),
      ),
    );
    const docs = [...affectedDocs.values()];

    const updatedAt = Timestamp.now();
    for (let offset = 0; offset < docs.length; offset += 400) {
      const batch = this.db.batch();
      docs.slice(offset, offset + 400).forEach((doc) => {
        batch.update(doc.ref, {
          personal_statistics_version: 0,
          personal_statistics: null,
          updated_at: updatedAt,
        });
      });
      await batch.commit();
    }
  }

  async deleteMissingSeasonStats(
    leagueId: string,
    seasonId: string,
    keepUserIds: string[],
  ): Promise<void> {
    await this.deleteMissingScopeStats({
      scopeType: "season",
      leagueId,
      seasonId,
      keepUserIds,
    });
  }

  async deleteMissingScopeStats(params: {
    scopeType: ScopeType;
    leagueId: string | null;
    seasonId: string | null;
    keepUserIds: string[];
  }): Promise<void> {
    const snapshot = await this.db
      .collection("user_stats")
      .where("scope_type", "==", params.scopeType)
      .where("league_id", "==", params.leagueId)
      .where("season_id", "==", params.seasonId)
      .get();
    const keepUserIds = new Set(params.keepUserIds);
    const staleDocs = snapshot.docs.filter(
      (doc) => !keepUserIds.has(String(doc.data().user_id)),
    );

    await Promise.all(staleDocs.map((doc) => doc.ref.delete()));
  }

  async deleteStatsForLeague(leagueId: string): Promise<void> {
    const snapshot = await this.db.collection("user_stats").get();
    const docs = snapshot.docs.filter(
      (doc) => doc.data().league_id === leagueId,
    );
    await Promise.all(docs.map((doc) => doc.ref.delete()));
  }

  private query(params: {
    userId: string;
    scopeType: ScopeType;
    leagueId?: string;
    seasonId?: string;
  }) {
    let query = this.db
      .collection("user_stats")
      .where("user_id", "==", params.userId)
      .where("scope_type", "==", params.scopeType);
    if (params.leagueId !== undefined) {
      query = query.where("league_id", "==", params.leagueId);
    }
    if (params.seasonId !== undefined) {
      query = query.where("season_id", "==", params.seasonId);
    }
    return query;
  }

  private map(id: string, data: FirebaseFirestore.DocumentData): UserStats {
    const scopeType = requiredString(data.scope_type, "user_stats.scope_type");
    if (
      scopeType !== "overall" &&
      scopeType !== "league" &&
      scopeType !== "season"
    ) {
      throw new TypeError(
        "invalid or missing Firestore field: user_stats.scope_type",
      );
    }

    const leagueId =
      data.league_id === null
        ? null
        : asOpaqueId(requiredString(data.league_id, "user_stats.league_id"));
    const seasonId =
      data.season_id === null
        ? null
        : asOpaqueId(requiredString(data.season_id, "user_stats.season_id"));

    return {
      id: asOpaqueId(id),
      userId: asOpaqueId(requiredString(data.user_id, "user_stats.user_id")),
      userName: requiredString(data.user_name, "user_stats.user_name"),
      scopeType,
      leagueId,
      seasonId,
      leagueName: nullableString(data.league_name, "user_stats.league_name"),
      seasonName: nullableString(data.season_name, "user_stats.season_name"),
      totalPoints: requiredNumber(data.total_points, "user_stats.total_points"),
      totalMatchCount: requiredNumber(
        data.total_match_count,
        "user_stats.total_match_count",
      ),
      chomboCount:
        data.chombo_count === undefined
          ? 0
          : requiredNumber(data.chombo_count, "user_stats.chombo_count"),
      averageRank: requiredNumber(data.average_rank, "user_stats.average_rank"),
      currentRank: nullableNumber(data.current_rank, "user_stats.current_rank"),
      firstCount: requiredNumber(data.first_count, "user_stats.first_count"),
      secondCount: requiredNumber(data.second_count, "user_stats.second_count"),
      thirdCount: requiredNumber(data.third_count, "user_stats.third_count"),
      fourthCount: nullableNumber(data.fourth_count, "user_stats.fourth_count"),
      firstRate: requiredNumber(data.first_rate, "user_stats.first_rate"),
      secondRate: requiredNumber(data.second_rate, "user_stats.second_rate"),
      thirdRate: requiredNumber(data.third_rate, "user_stats.third_rate"),
      fourthRate: nullableNumber(data.fourth_rate, "user_stats.fourth_rate"),
      highestScore: nullableNumber(
        data.highest_score,
        "user_stats.highest_score",
      ),
      lowestScore: nullableNumber(data.lowest_score, "user_stats.lowest_score"),
      averageScore: nullableNumber(
        data.average_score,
        "user_stats.average_score",
      ),
      winStreak: nullableNumber(data.win_streak, "user_stats.win_streak"),
      loseStreak: nullableNumber(data.lose_streak, "user_stats.lose_streak"),
      createdAt: toIsoString(data.created_at),
      updatedAt: toIsoString(data.updated_at),
    };
  }

  private mapWithPersonalStatistics(
    id: string,
    data: FirebaseFirestore.DocumentData,
  ): UserStatsWithPersonalStatistics {
    const personalStatisticsVersion =
      data.personal_statistics_version === undefined
        ? 0
        : requiredNumber(
            data.personal_statistics_version,
            "user_stats.personal_statistics_version",
          );
    if (
      !Number.isSafeInteger(personalStatisticsVersion) ||
      personalStatisticsVersion < 0
    ) {
      throw new TypeError(
        "invalid or missing Firestore field: user_stats.personal_statistics_version",
      );
    }

    const personalStatisticsSnapshot =
      data.personal_statistics === undefined ||
      data.personal_statistics === null
        ? null
        : mapPersonalStatisticsSnapshot(data.personal_statistics);
    if (personalStatisticsVersion > 0 && personalStatisticsSnapshot === null) {
      throw new TypeError(
        "missing Firestore field: user_stats.personal_statistics",
      );
    }

    return {
      stats: this.map(id, data),
      personalStatisticsVersion,
      personalStatisticsSnapshot,
    };
  }
}
