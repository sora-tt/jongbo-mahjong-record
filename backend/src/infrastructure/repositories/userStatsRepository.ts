import { Timestamp, type Firestore } from "firebase-admin/firestore";
import type { ScopeType, UserStats } from "@/domain/models.js";
import type { UserStatsRepository } from "@/domain/repositories/userStatsRepository.js";
import { toIsoString } from "@/infrastructure/firestore/utils.js";

export class FirestoreUserStatsRepository implements UserStatsRepository {
  constructor(private readonly db: Firestore) {}

  async get(params: {
    userId: string;
    scopeType: ScopeType;
    leagueId?: string;
    seasonId?: string;
  }): Promise<UserStats | null> {
    const snapshot = await this.query(params).limit(1).get();
    const doc = snapshot.docs[0];
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
    const existing = await this.query({
      userId: key.userId,
      scopeType: key.scopeType,
      leagueId: key.leagueId ?? undefined,
      seasonId: key.seasonId ?? undefined,
    })
      .limit(1)
      .get();

    const now = Timestamp.now();
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

    if (existing.empty) {
      const ref = this.db.collection("user_stats").doc();
      await ref.set({
        id: ref.id,
        ...payload,
        created_at: now,
      });
      return ref.id;
    }

    const doc = existing.docs[0];
    await doc.ref.update(payload);
    return doc.id;
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
    return {
      id,
      userId: String(data.user_id ?? ""),
      userName: String(data.user_name ?? ""),
      scopeType: data.scope_type,
      leagueId: data.league_id ?? null,
      seasonId: data.season_id ?? null,
      leagueName: data.league_name ?? null,
      seasonName: data.season_name ?? null,
      totalPoints: Number(data.total_points ?? 0),
      totalMatchCount: Number(data.total_match_count ?? 0),
      averageRank: Number(data.average_rank ?? 0),
      currentRank: data.current_rank ?? null,
      firstCount: Number(data.first_count ?? 0),
      secondCount: Number(data.second_count ?? 0),
      thirdCount: Number(data.third_count ?? 0),
      fourthCount: data.fourth_count ?? null,
      firstRate: Number(data.first_rate ?? 0),
      secondRate: Number(data.second_rate ?? 0),
      thirdRate: Number(data.third_rate ?? 0),
      fourthRate: data.fourth_rate ?? null,
      highestScore: data.highest_score ?? null,
      lowestScore: data.lowest_score ?? null,
      averageScore: data.average_score ?? null,
      winStreak: data.win_streak ?? null,
      loseStreak: data.lose_streak ?? null,
      createdAt: toIsoString(data.created_at),
      updatedAt: toIsoString(data.updated_at),
    };
  }
}
