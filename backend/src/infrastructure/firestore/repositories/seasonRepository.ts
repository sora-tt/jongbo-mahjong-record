import { Timestamp, type Firestore } from "firebase-admin/firestore";
import type {
  PointProgression,
  SeasonDetail,
  SeasonMember,
  SeasonSummary,
  Standing,
} from "@/domain/season/types.js";
import type {
  CreateSeasonInput,
  SeasonRepository,
  UpdateSeasonInput,
} from "@/domain/season/repository.js";
import { toIsoString } from "@/infrastructure/firestore/utils.js";
import { NotFoundError } from "@/domain/shared/errors.js";

export class FirestoreSeasonRepository implements SeasonRepository {
  constructor(private readonly db: Firestore) {}

  async list(leagueId: string): Promise<SeasonSummary[]> {
    const leagueRef = this.db.collection("leagues").doc(leagueId);
    const leagueSnapshot = await leagueRef.get();
    if (!leagueSnapshot.exists) {
      throw new NotFoundError("league not found", { leagueId });
    }

    const snapshot = await leagueRef
      .collection("seasons")
      .orderBy("created_at", "asc")
      .get();
    return snapshot.docs.map((doc) =>
      this.mapSummary(leagueId, doc.id, doc.data()),
    );
  }

  async get(leagueId: string, seasonId: string): Promise<SeasonDetail> {
    const seasonSnapshot = await this.db
      .collection("leagues")
      .doc(leagueId)
      .collection("seasons")
      .doc(seasonId)
      .get();
    if (!seasonSnapshot.exists) {
      throw new NotFoundError("season not found", { leagueId, seasonId });
    }

    return this.mapDetail(
      leagueId,
      seasonSnapshot.id,
      seasonSnapshot.data() ?? {},
    );
  }

  async create(
    leagueId: string,
    input: CreateSeasonInput,
    members: SeasonMember[],
  ): Promise<SeasonDetail> {
    const seasonRef = this.db
      .collection("leagues")
      .doc(leagueId)
      .collection("seasons")
      .doc();
    const now = Timestamp.now();
    await seasonRef.set({
      id: seasonRef.id,
      name: input.name,
      status: input.status ?? "active",
      members: members.map((member) => ({
        user_id: member.userId,
        user_name: member.userName,
      })),
      member_count: members.length,
      total_match_count: 0,
      standings: [],
      point_progressions: [],
      season_records: null,
      created_at: now,
      updated_at: now,
    });

    return this.get(leagueId, seasonRef.id);
  }

  async update(
    leagueId: string,
    seasonId: string,
    input: UpdateSeasonInput,
  ): Promise<SeasonDetail> {
    const seasonRef = this.db
      .collection("leagues")
      .doc(leagueId)
      .collection("seasons")
      .doc(seasonId);
    const snapshot = await seasonRef.get();
    if (!snapshot.exists) {
      throw new NotFoundError("season not found", { leagueId, seasonId });
    }

    const patch: Record<string, unknown> = { updated_at: Timestamp.now() };
    if (input.name !== undefined) {
      patch.name = input.name;
    }
    if (input.status !== undefined) {
      patch.status = input.status;
    }

    await seasonRef.update(patch);
    return this.get(leagueId, seasonId);
  }

  async delete(leagueId: string, seasonId: string): Promise<void> {
    const ref = this.db
      .collection("leagues")
      .doc(leagueId)
      .collection("seasons")
      .doc(seasonId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      throw new NotFoundError("season not found", { leagueId, seasonId });
    }

    await this.db.recursiveDelete(ref);
  }

  async listMembers(
    leagueId: string,
    seasonId: string,
  ): Promise<SeasonMember[]> {
    const season = await this.get(leagueId, seasonId);
    return season.members;
  }

  async updateStatistics(params: {
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
  }): Promise<void> {
    await this.db
      .collection("leagues")
      .doc(params.leagueId)
      .collection("seasons")
      .doc(params.seasonId)
      .update({
        total_match_count: params.totalMatchCount,
        standings: params.standings.map((standing) => ({
          rank: standing.rank,
          user_id: standing.userId,
          user_name: standing.userName,
          total_points: standing.totalPoints,
          match_count: standing.matchCount,
          first_count: standing.firstCount,
          second_count: standing.secondCount,
          third_count: standing.thirdCount,
          fourth_count: standing.fourthCount,
        })),
        point_progressions: params.pointProgressions.map((progression) => ({
          user_id: progression.userId,
          user_name: progression.userName,
          points: progression.points.map((point) => ({
            match_index: point.matchIndex,
            total_points: point.totalPoints,
          })),
        })),
        season_records: params.seasonRecords
          ? {
              highest_score: this.toRecordHolderDoc(
                params.seasonRecords.highestScore,
              ),
              avoid_last_rate: this.toRecordHolderDoc(
                params.seasonRecords.avoidLastRate,
              ),
              top2_rate: this.toRecordHolderDoc(params.seasonRecords.top2Rate),
            }
          : null,
        updated_at: Timestamp.now(),
      });
  }

  async findActiveSeason(leagueId: string): Promise<SeasonSummary | null> {
    const snapshot = await this.db
      .collection("leagues")
      .doc(leagueId)
      .collection("seasons")
      .where("status", "==", "active")
      .limit(1)
      .get();
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return this.mapSummary(leagueId, doc.id, doc.data());
  }

  private mapSummary(
    leagueId: string,
    seasonId: string,
    data: FirebaseFirestore.DocumentData,
  ): SeasonSummary {
    return {
      id: seasonId,
      leagueId,
      name: String(data.name ?? ""),
      status: data.status,
      memberCount: Number(data.member_count ?? 0),
      totalMatchCount: Number(data.total_match_count ?? 0),
      createdAt: toIsoString(data.created_at),
      updatedAt: toIsoString(data.updated_at),
    };
  }

  private mapDetail(
    leagueId: string,
    seasonId: string,
    data: FirebaseFirestore.DocumentData,
  ): SeasonDetail {
    const standings = Array.isArray(data.standings)
      ? data.standings.map((standing) => ({
          rank: Number(standing.rank ?? 0),
          userId: String(standing.user_id ?? ""),
          userName: String(standing.user_name ?? ""),
          totalPoints: Number(standing.total_points ?? 0),
          matchCount: Number(standing.match_count ?? 0),
          firstCount: Number(standing.first_count ?? 0),
          secondCount: Number(standing.second_count ?? 0),
          thirdCount: Number(standing.third_count ?? 0),
          fourthCount: standing.fourth_count ?? null,
        }))
      : [];
    const pointProgressions = Array.isArray(data.point_progressions)
      ? data.point_progressions.map((progression) => ({
          userId: String(progression.user_id ?? ""),
          userName: String(progression.user_name ?? ""),
          points: Array.isArray(progression.points)
            ? progression.points.map(
                (point: FirebaseFirestore.DocumentData) => ({
                  matchIndex: Number(point.match_index ?? 0),
                  totalPoints: Number(point.total_points ?? 0),
                }),
              )
            : [],
        }))
      : [];

    return {
      id: seasonId,
      leagueId,
      name: String(data.name ?? ""),
      status: data.status,
      memberCount: Number(data.member_count ?? 0),
      totalMatchCount: Number(data.total_match_count ?? 0),
      members: Array.isArray(data.members)
        ? data.members.map((member) => ({
            userId: String(member.user_id ?? ""),
            userName: String(member.user_name ?? ""),
          }))
        : [],
      standings,
      pointProgressions,
      seasonRecords: data.season_records
        ? {
            highestScore: this.mapRecordHolder(
              data.season_records.highest_score,
            ),
            avoidLastRate: this.mapRecordHolder(
              data.season_records.avoid_last_rate,
            ),
            top2Rate: this.mapRecordHolder(data.season_records.top2_rate),
          }
        : null,
      latestPlayedAt: pointProgressions.length > 0 ? null : null,
      createdAt: toIsoString(data.created_at),
      updatedAt: toIsoString(data.updated_at),
    };
  }

  private mapRecordHolder(
    value: FirebaseFirestore.DocumentData | null | undefined,
  ) {
    if (!value) {
      return null;
    }

    return {
      value: Number(value.value ?? 0),
      userId: String(value.user_id ?? ""),
      userName: String(value.user_name ?? ""),
    };
  }

  private toRecordHolderDoc(
    value: { value: number; userId: string; userName: string } | null,
  ) {
    if (!value) {
      return null;
    }

    return {
      value: value.value,
      user_id: value.userId,
      user_name: value.userName,
    };
  }
}
