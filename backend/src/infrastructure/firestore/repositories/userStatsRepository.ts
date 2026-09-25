import { Timestamp, type Firestore } from "firebase-admin/firestore";
import type { UserStats } from "@/domain/user/types.js";
import type { UserStatsRepository } from "@/domain/user/repository.js";
import type { ScopeType } from "@/domain/shared/types.js";
import {
  nullableNumber,
  nullableString,
  requiredNumber,
  requiredString,
  toIsoString,
} from "@/infrastructure/firestore/utils.js";
import { asOpaqueId } from "@/domain/shared/types.js";
import { buildUserStatsId, type UserStatsKey } from "@/domain/user/statsKey.js";

export class FirestoreUserStatsRepository implements UserStatsRepository {
  constructor(private readonly db: Firestore) {}

  async get(params: {
    userId: string;
    scopeType: ScopeType;
    leagueId?: string;
    seasonId?: string;
  }): Promise<UserStats | null> {
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
      return this.map(canonical.id, canonical.data() ?? {});
    }

    const legacy = await this.query(params).limit(1).get();
    const doc = legacy.docs[0];
    return doc ? this.map(doc.id, doc.data()) : null;
  }

  async upsert(
    key: {
      userId: string;
      scopeType: ScopeType;
      leagueId: string | null;
      seasonId: string | null;
    },
    data: Omit<UserStats, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
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

  async deleteMissingSeasonStats(
    leagueId: string,
    seasonId: string,
    keepUserIds: string[],
  ): Promise<void> {
    const snapshot = await this.db
      .collection("user_stats")
      .where("scope_type", "==", "season")
      .where("league_id", "==", leagueId)
      .where("season_id", "==", seasonId)
      .get();

    await Promise.all(
      snapshot.docs
        .filter((doc) => !keepUserIds.includes(String(doc.data().user_id)))
        .map((doc) => doc.ref.delete()),
    );
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
}
