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
import {
  nullableNumber,
  nullableObject,
  requiredArray,
  requiredNumber,
  requiredObject,
  requiredString,
  toIsoString,
} from "@/infrastructure/firestore/utils.js";
import { ConflictError, NotFoundError } from "@/domain/shared/errors.js";
import { asOpaqueId } from "@/domain/shared/types.js";

const mapSeasonStatus = (value: unknown) => {
  const status = requiredString(value, "seasons.status");
  if (status !== "active" && status !== "archived") {
    throw new TypeError("invalid or missing Firestore field: seasons.status");
  }
  return status;
};

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
    const leagueRef = this.db.collection("leagues").doc(leagueId);
    const seasonRef = leagueRef.collection("seasons").doc();
    const status = input.status ?? "active";

    await this.db.runTransaction(async (transaction) => {
      const leagueSnapshot = await transaction.get(leagueRef);
      if (!leagueSnapshot.exists) {
        throw new NotFoundError("league not found", { leagueId });
      }

      if (status === "active") {
        const activeSeasonSnapshot = await transaction.get(
          leagueRef
            .collection("seasons")
            .where("status", "==", "active")
            .limit(1),
        );
        const activeSeasonId = leagueSnapshot.data()?.active_season_id;
        if (
          !activeSeasonSnapshot.empty ||
          (activeSeasonId !== null && activeSeasonId !== undefined)
        ) {
          throw new ConflictError("active season already exists", {
            activeSeasonId:
              activeSeasonId ?? activeSeasonSnapshot.docs[0]?.id ?? null,
          });
        }
      }

      const now = Timestamp.now();
      transaction.set(seasonRef, {
        id: seasonRef.id,
        name: input.name,
        status,
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
      if (status === "active") {
        transaction.update(leagueRef, {
          active_season_id: seasonRef.id,
          active_season_name: input.name,
          updated_at: now,
        });
      }
    });

    return this.get(leagueId, seasonRef.id);
  }

  async update(
    leagueId: string,
    seasonId: string,
    input: UpdateSeasonInput,
  ): Promise<SeasonDetail> {
    const leagueRef = this.db.collection("leagues").doc(leagueId);
    const seasonRef = leagueRef.collection("seasons").doc(seasonId);

    await this.db.runTransaction(async (transaction) => {
      const leagueSnapshot = await transaction.get(leagueRef);
      const seasonSnapshot = await transaction.get(seasonRef);
      const activeSeasonSnapshot =
        input.status === "active"
          ? await transaction.get(
              leagueRef
                .collection("seasons")
                .where("status", "==", "active")
                .limit(1),
            )
          : null;
      if (!leagueSnapshot.exists) {
        throw new NotFoundError("league not found", { leagueId });
      }
      if (!seasonSnapshot.exists) {
        throw new NotFoundError("season not found", { leagueId, seasonId });
      }

      const currentData = seasonSnapshot.data() ?? {};
      const nextStatus = input.status ?? currentData.status;
      const activeSeasonId = leagueSnapshot.data()?.active_season_id;
      if (
        nextStatus === "active" &&
        ((activeSeasonId !== null &&
          activeSeasonId !== undefined &&
          activeSeasonId !== seasonId) ||
          activeSeasonSnapshot?.docs.some((doc) => doc.id !== seasonId))
      ) {
        throw new ConflictError("active season already exists", {
          activeSeasonId,
        });
      }

      const patch: Record<string, unknown> = {
        updated_at: Timestamp.now(),
      };
      if (input.name !== undefined) {
        patch.name = input.name;
      }
      if (input.status !== undefined) {
        patch.status = input.status;
      }

      transaction.update(seasonRef, patch);
      if (input.status === "active") {
        transaction.update(leagueRef, {
          active_season_id: seasonId,
          active_season_name: input.name ?? currentData.name,
          updated_at: patch.updated_at,
        });
      } else if (input.status === "archived" && activeSeasonId === seasonId) {
        transaction.update(leagueRef, {
          active_season_id: null,
          active_season_name: null,
          updated_at: patch.updated_at,
        });
      }
    });

    return this.get(leagueId, seasonId);
  }

  async delete(leagueId: string, seasonId: string): Promise<void> {
    const leagueRef = this.db.collection("leagues").doc(leagueId);
    const ref = leagueRef.collection("seasons").doc(seasonId);
    await this.db.runTransaction(async (transaction) => {
      const leagueSnapshot = await transaction.get(leagueRef);
      const seasonSnapshot = await transaction.get(ref);
      if (!leagueSnapshot.exists) {
        throw new NotFoundError("league not found", { leagueId });
      }
      if (!seasonSnapshot.exists) {
        throw new NotFoundError("season not found", { leagueId, seasonId });
      }
      if (leagueSnapshot.data()?.active_season_id === seasonId) {
        transaction.update(leagueRef, {
          active_season_id: null,
          active_season_name: null,
          updated_at: Timestamp.now(),
        });
      }
    });
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
      id: asOpaqueId(seasonId),
      leagueId: asOpaqueId(leagueId),
      name: requiredString(data.name, "seasons.name"),
      status: mapSeasonStatus(data.status),
      memberCount: requiredNumber(data.member_count, "seasons.member_count"),
      totalMatchCount: requiredNumber(
        data.total_match_count,
        "seasons.total_match_count",
      ),
      createdAt: toIsoString(data.created_at),
      updatedAt: toIsoString(data.updated_at),
    };
  }

  private mapDetail(
    leagueId: string,
    seasonId: string,
    data: FirebaseFirestore.DocumentData,
  ): SeasonDetail {
    const standings = requiredArray(data.standings, "seasons.standings").map(
      (value) => {
        const standing = requiredObject(value, "seasons.standings[]");
        return {
          rank: requiredNumber(standing.rank, "seasons.standings[].rank"),
          userId: asOpaqueId(
            requiredString(standing.user_id, "seasons.standings[].user_id"),
          ),
          userName: requiredString(
            standing.user_name,
            "seasons.standings[].user_name",
          ),
          totalPoints: requiredNumber(
            standing.total_points,
            "seasons.standings[].total_points",
          ),
          matchCount: requiredNumber(
            standing.match_count,
            "seasons.standings[].match_count",
          ),
          firstCount: requiredNumber(
            standing.first_count,
            "seasons.standings[].first_count",
          ),
          secondCount: requiredNumber(
            standing.second_count,
            "seasons.standings[].second_count",
          ),
          thirdCount: requiredNumber(
            standing.third_count,
            "seasons.standings[].third_count",
          ),
          fourthCount: nullableNumber(
            standing.fourth_count,
            "seasons.standings[].fourth_count",
          ),
        };
      },
    );
    const pointProgressions = requiredArray(
      data.point_progressions,
      "seasons.point_progressions",
    ).map((value) => {
      const progression = requiredObject(value, "seasons.point_progressions[]");
      const points = requiredArray(
        progression.points,
        "seasons.point_progressions[].points",
      ).map((pointValue) => {
        const point = requiredObject(
          pointValue,
          "seasons.point_progressions[].points[]",
        );
        return {
          matchIndex: requiredNumber(
            point.match_index,
            "seasons.point_progressions[].points[].match_index",
          ),
          totalPoints: requiredNumber(
            point.total_points,
            "seasons.point_progressions[].points[].total_points",
          ),
        };
      });
      return {
        userId: asOpaqueId(
          requiredString(
            progression.user_id,
            "seasons.point_progressions[].user_id",
          ),
        ),
        userName: requiredString(
          progression.user_name,
          "seasons.point_progressions[].user_name",
        ),
        points,
      };
    });
    const members = requiredArray(data.members, "seasons.members").map(
      (value) => {
        const member = requiredObject(value, "seasons.members[]");
        return {
          userId: asOpaqueId(
            requiredString(member.user_id, "seasons.members[].user_id"),
          ),
          userName: requiredString(
            member.user_name,
            "seasons.members[].user_name",
          ),
        };
      },
    );

    return {
      id: asOpaqueId(seasonId),
      leagueId: asOpaqueId(leagueId),
      name: requiredString(data.name, "seasons.name"),
      status: mapSeasonStatus(data.status),
      memberCount: requiredNumber(data.member_count, "seasons.member_count"),
      totalMatchCount: requiredNumber(
        data.total_match_count,
        "seasons.total_match_count",
      ),
      members,
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
    const record = nullableObject(value, "record");
    if (!record) {
      return null;
    }

    return {
      value: requiredNumber(record.value, "record.value"),
      userId: asOpaqueId(requiredString(record.user_id, "record.user_id")),
      userName: requiredString(record.user_name, "record.user_name"),
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
