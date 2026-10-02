import { Timestamp, type Firestore } from "firebase-admin/firestore";
import type {
  LeagueDetail,
  LeagueMember,
  LeagueSummary,
} from "@/domain/league/types.js";
import type {
  CreateLeagueInput,
  LeagueRule,
  LeagueRepository,
  UpdateLeagueInput,
} from "@/domain/league/repository.js";
import type { UserRepository } from "@/domain/user/repository.js";
import {
  nullableNumber,
  nullableObject,
  nullableString,
  requiredArray,
  requiredNumber,
  requiredObject,
  requiredString,
  toIsoString,
} from "@/infrastructure/firestore/utils.js";
import { ConflictError, NotFoundError } from "@/domain/shared/errors.js";
import { asOpaqueId } from "@/domain/shared/types.js";
import type { UserReference } from "@/domain/shared/types.js";

export class FirestoreLeagueRepository implements LeagueRepository {
  constructor(
    private readonly db: Firestore,
    private readonly userRepository: UserRepository,
  ) {}

  async list(memberUserId?: string): Promise<LeagueSummary[]> {
    const docs =
      memberUserId === undefined
        ? (
            await this.db
              .collection("leagues")
              .orderBy("created_at", "asc")
              .get()
          ).docs
        : await this.findLeagueDocsByMember(memberUserId);

    return Promise.all(
      docs.map(async (doc) => {
        const data = requiredObject(doc.data(), "leagues");
        const activeSeasonId = nullableString(
          data.active_season_id,
          "leagues.active_season_id",
        );
        const activeSeasonName = nullableString(
          data.active_season_name,
          "leagues.active_season_name",
        );
        const myStanding = activeSeasonId
          ? await this.findMyStanding(
              doc.id,
              activeSeasonId,
              memberUserId ?? "",
            )
          : null;

        return {
          id: asOpaqueId(doc.id),
          name: requiredString(data.name, "leagues.name"),
          memberCount: requiredNumber(
            data.member_count,
            "leagues.member_count",
          ),
          totalMatchCount: requiredNumber(
            data.total_match_count,
            "leagues.total_match_count",
          ),
          activeSeason:
            activeSeasonId && activeSeasonName
              ? { id: asOpaqueId(activeSeasonId), name: activeSeasonName }
              : null,
          myStanding,
          createdAt: toIsoString(data.created_at),
          updatedAt: toIsoString(data.updated_at),
        };
      }),
    );
  }

  async get(leagueId: string): Promise<LeagueDetail> {
    const snapshot = await this.db.collection("leagues").doc(leagueId).get();
    if (!snapshot.exists) {
      throw new NotFoundError("league not found", { leagueId });
    }

    const members = await this.listMembers(leagueId);
    const data = requiredObject(snapshot.data(), "leagues");
    const activeSeasonId = nullableString(
      data.active_season_id,
      "leagues.active_season_id",
    );
    const activeSeasonName = nullableString(
      data.active_season_name,
      "leagues.active_season_name",
    );
    const leagueRecords = nullableObject(
      data.league_records,
      "leagues.league_records",
    );

    return {
      id: asOpaqueId(snapshot.id),
      name: requiredString(data.name, "leagues.name"),
      rule: this.mapLeagueRule(data.rule),
      memberCount: requiredNumber(data.member_count, "leagues.member_count"),
      totalMatchCount: requiredNumber(
        data.total_match_count,
        "leagues.total_match_count",
      ),
      activeSeason:
        activeSeasonId && activeSeasonName
          ? { id: asOpaqueId(activeSeasonId), name: activeSeasonName }
          : null,
      members,
      leagueRecords: leagueRecords
        ? {
            winStreak: this.mapRecordHolder(leagueRecords.win_streak),
            loseStreak: this.mapRecordHolder(leagueRecords.lose_streak),
            highestScore: this.mapRecordHolder(leagueRecords.highest_score),
            lowestScore: this.mapRecordHolder(leagueRecords.lowest_score),
          }
        : null,
      createdAt: toIsoString(data.created_at),
      updatedAt: toIsoString(data.updated_at),
    };
  }

  async getRule(leagueId: string): Promise<LeagueRule> {
    const snapshot = await this.db.collection("leagues").doc(leagueId).get();
    if (!snapshot.exists) {
      throw new NotFoundError("league not found", { leagueId });
    }

    return this.mapLeagueRule(snapshot.data()?.rule);
  }

  async create(input: CreateLeagueInput): Promise<LeagueDetail> {
    const now = Timestamp.now();
    const leagueRef = this.db.collection("leagues").doc();
    const members = await this.userRepository.getByIds(input.memberUserIds);
    const batch = this.db.batch();

    batch.set(leagueRef, {
      id: leagueRef.id,
      name: input.name,
      rule: this.toLeagueRuleDoc(input.rule),
      member_count: members.length,
      total_match_count: 0,
      active_season_id: null,
      active_season_name: null,
      rule_locked: false,
      league_records: null,
      created_at: now,
      updated_at: now,
    });

    members.forEach((user) => {
      const memberRef = leagueRef.collection("members").doc();
      batch.set(memberRef, {
        id: memberRef.id,
        user_id: user.id,
        user_name: user.name,
      });
    });

    await batch.commit();
    return this.get(leagueRef.id);
  }

  async update(
    leagueId: string,
    input: UpdateLeagueInput,
  ): Promise<LeagueDetail> {
    const leagueRef = this.db.collection("leagues").doc(leagueId);
    const users =
      input.memberUserIds === undefined
        ? null
        : await this.userRepository.getByIds(input.memberUserIds);

    await this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(leagueRef);
      if (!snapshot.exists) {
        throw new NotFoundError("league not found", { leagueId });
      }

      const membersSnapshot =
        input.memberUserIds === undefined
          ? null
          : await transaction.get(leagueRef.collection("members"));
      if (input.rule !== undefined && snapshot.data()?.rule_locked === true) {
        throw new ConflictError("league rule is locked after the first match", {
          leagueId,
        });
      }

      const patch: Record<string, unknown> = {
        updated_at: Timestamp.now(),
      };
      if (input.name !== undefined) {
        patch.name = input.name;
      }
      if (input.rule !== undefined) {
        patch.rule = this.toLeagueRuleDoc(input.rule);
      }
      if (input.memberUserIds !== undefined) {
        patch.member_count = input.memberUserIds.length;
      }

      transaction.update(leagueRef, patch);

      membersSnapshot?.docs.forEach((doc) => {
        transaction.delete(doc.ref);
      });

      users?.forEach((user) => {
        const memberRef = leagueRef.collection("members").doc();
        transaction.set(memberRef, {
          id: memberRef.id,
          user_id: user.id,
          user_name: user.name,
        });
      });
    });

    return this.get(leagueId);
  }

  async delete(leagueId: string): Promise<void> {
    const ref = this.db.collection("leagues").doc(leagueId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      throw new NotFoundError("league not found", { leagueId });
    }

    await this.db.recursiveDelete(ref);
  }

  async listMembers(leagueId: string): Promise<LeagueMember[]> {
    const leagueSnapshot = await this.db
      .collection("leagues")
      .doc(leagueId)
      .get();
    if (!leagueSnapshot.exists) {
      throw new NotFoundError("league not found", { leagueId });
    }

    const snapshot = await leagueSnapshot.ref.collection("members").get();
    return snapshot.docs.map((doc) => ({
      id: asOpaqueId(doc.id),
      userId: asOpaqueId(
        requiredString(doc.data().user_id, "leagues.members.user_id"),
      ),
      userName: requiredString(
        doc.data().user_name,
        "leagues.members.user_name",
      ),
    }));
  }

  async areMembers(
    leagueId: string,
    viewerUserId: string,
    targetUserId: string,
  ): Promise<boolean> {
    if (!viewerUserId || !targetUserId) {
      return false;
    }

    const requestedUserIds = new Set([viewerUserId, targetUserId]);
    const snapshot = await this.db
      .collection("leagues")
      .doc(leagueId)
      .collection("members")
      .where("user_id", "in", [...requestedUserIds])
      .get();
    const matchedUserIds = new Set(
      snapshot.docs.map((doc) =>
        requiredString(doc.data().user_id, "leagues.members.user_id"),
      ),
    );

    return [...requestedUserIds].every((userId) => matchedUserIds.has(userId));
  }

  async listAllMembers(): Promise<UserReference[]> {
    const leaguesSnapshot = await this.db.collection("leagues").get();
    const members = await Promise.all(
      leaguesSnapshot.docs.map((leagueDoc) => this.listMembers(leagueDoc.id)),
    );
    const byUserId = new Map<string, UserReference>();
    members.flat().forEach((member) => {
      byUserId.set(member.userId, {
        userId: member.userId,
        userName: member.userName,
      });
    });
    return [...byUserId.values()];
  }

  async setActiveSeason(
    leagueId: string,
    seasonId: string | null,
    seasonName: string | null,
  ): Promise<void> {
    await this.db.collection("leagues").doc(leagueId).update({
      active_season_id: seasonId,
      active_season_name: seasonName,
      updated_at: Timestamp.now(),
    });
  }

  async updateLeagueStatistics(params: {
    leagueId: string;
    totalMatchCount: number;
    leagueRecords: {
      winStreak: { value: number; userId: string; userName: string } | null;
      loseStreak: { value: number; userId: string; userName: string } | null;
      highestScore: { value: number; userId: string; userName: string } | null;
      lowestScore: { value: number; userId: string; userName: string } | null;
    } | null;
  }): Promise<void> {
    await this.db
      .collection("leagues")
      .doc(params.leagueId)
      .update({
        total_match_count: params.totalMatchCount,
        league_records: params.leagueRecords
          ? {
              win_streak: this.toRecordHolderDoc(
                params.leagueRecords.winStreak,
              ),
              lose_streak: this.toRecordHolderDoc(
                params.leagueRecords.loseStreak,
              ),
              highest_score: this.toRecordHolderDoc(
                params.leagueRecords.highestScore,
              ),
              lowest_score: this.toRecordHolderDoc(
                params.leagueRecords.lowestScore,
              ),
            }
          : null,
        updated_at: Timestamp.now(),
      });
  }

  private async findLeagueDocsByMember(
    memberUserId: string,
  ): Promise<
    FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>[]
  > {
    try {
      const memberSnapshots = await this.db
        .collectionGroup("members")
        .where("user_id", "==", memberUserId)
        .get();
      const leagueIds = [
        ...new Set(
          memberSnapshots.docs
            .map((doc) => doc.ref.parent.parent?.id)
            .filter(Boolean),
        ),
      ] as string[];
      const snapshots = await Promise.all(
        leagueIds.map((leagueId) =>
          this.db.collection("leagues").doc(leagueId).get(),
        ),
      );
      return snapshots.filter(
        (
          snapshot,
        ): snapshot is FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData> & {
          exists: true;
        } => snapshot.exists,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const shouldFallback =
        message.includes("requires an index") ||
        message.includes("FAILED_PRECONDITION") ||
        message.includes("9 FAILED_PRECONDITION");

      if (!shouldFallback) {
        throw error;
      }

      const leaguesSnapshot = await this.db.collection("leagues").get();
      const matched: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>[] =
        [];

      for (const leagueDoc of leaguesSnapshot.docs) {
        const memberSnapshot = await leagueDoc.ref
          .collection("members")
          .where("user_id", "==", memberUserId)
          .limit(1)
          .get();
        if (!memberSnapshot.empty) {
          matched.push(leagueDoc);
        }
      }

      return matched;
    }
  }

  private async findMyStanding(
    leagueId: string,
    seasonId: string,
    memberUserId: string,
  ) {
    if (!memberUserId) {
      return null;
    }

    const seasonSnapshot = await this.db
      .collection("leagues")
      .doc(leagueId)
      .collection("seasons")
      .doc(seasonId)
      .get();
    if (!seasonSnapshot.exists) {
      return null;
    }

    const standings = requiredArray(
      seasonSnapshot.data()?.standings,
      "seasons.standings",
    );
    const standing = standings.find(
      (item) =>
        requiredObject(item, "seasons.standings[]").user_id === memberUserId,
    );

    if (!standing) {
      return null;
    }

    const standingData = requiredObject(standing, "seasons.standings[]");
    return {
      rank:
        standingData.rank === null
          ? null
          : requiredNumber(standingData.rank, "seasons.standings.rank"),
      totalPoints: requiredNumber(
        standingData.total_points,
        "seasons.standings.total_points",
      ),
    };
  }

  private mapRecordHolder(value: unknown) {
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

  private mapLeagueRule(value: unknown) {
    const rule = requiredObject(value, "leagues.rule");
    const gameType = requiredString(rule.game_type, "leagues.rule.game_type");
    if (gameType !== "sanma" && gameType !== "yonma") {
      throw new TypeError(
        "invalid or missing Firestore field: leagues.rule.game_type",
      );
    }
    const uma = requiredObject(rule.uma, "leagues.rule.uma");
    const oka = requiredObject(rule.oka, "leagues.rule.oka");
    const chomboPenaltyPoints =
      rule.chombo_penalty_points === undefined
        ? 0
        : requiredNumber(
            rule.chombo_penalty_points,
            "leagues.rule.chombo_penalty_points",
          );
    const storedAllowOffTableKyotaku = rule.allow_off_table_kyotaku;
    if (
      storedAllowOffTableKyotaku !== undefined &&
      typeof storedAllowOffTableKyotaku !== "boolean"
    ) {
      throw new TypeError(
        "invalid Firestore field: leagues.rule.allow_off_table_kyotaku",
      );
    }
    const allowOffTableKyotaku = storedAllowOffTableKyotaku ?? false;
    const umaMode =
      "mode" in uma
        ? requiredString(uma.mode, "leagues.rule.uma.mode")
        : "fixed";
    if (umaMode !== "fixed" && umaMode !== "floating_count") {
      throw new TypeError(`unsupported Firestore league uma mode: ${umaMode}`);
    }

    const mappedOka = {
      startingPoints: requiredNumber(
        oka.starting_points,
        "leagues.rule.oka.starting_points",
      ),
      returnPoints: requiredNumber(
        oka.return_points,
        "leagues.rule.oka.return_points",
      ),
    };

    if (umaMode === "floating_count") {
      if (gameType !== "yonma") {
        throw new TypeError(
          "invalid Firestore league rule: floating_count uma requires yonma",
        );
      }

      const pointsByFloatingCount = requiredObject(
        uma.points_by_floating_count,
        "leagues.rule.uma.points_by_floating_count",
      );
      const mapRankPoints = (floatingCount: number) => {
        const row = requiredObject(
          pointsByFloatingCount[String(floatingCount)],
          `leagues.rule.uma.points_by_floating_count.${floatingCount}`,
        );
        return {
          first: requiredNumber(
            row.first,
            `leagues.rule.uma.points_by_floating_count.${floatingCount}.first`,
          ),
          second: requiredNumber(
            row.second,
            `leagues.rule.uma.points_by_floating_count.${floatingCount}.second`,
          ),
          third: requiredNumber(
            row.third,
            `leagues.rule.uma.points_by_floating_count.${floatingCount}.third`,
          ),
          fourth: requiredNumber(
            row.fourth,
            `leagues.rule.uma.points_by_floating_count.${floatingCount}.fourth`,
          ),
        };
      };

      return {
        gameType,
        uma: {
          mode: "floatingCount",
          pointsByFloatingCount: {
            0: mapRankPoints(0),
            1: mapRankPoints(1),
            2: mapRankPoints(2),
            3: mapRankPoints(3),
            4: mapRankPoints(4),
          },
        },
        oka: mappedOka,
        chomboPenaltyPoints,
        allowOffTableKyotaku,
      } satisfies LeagueRule;
    }

    const fourth = nullableNumber(uma.fourth, "leagues.rule.uma.fourth");
    if (gameType === "sanma" && fourth !== null) {
      throw new TypeError(
        "invalid or missing Firestore field: leagues.rule.uma.fourth",
      );
    }
    if (gameType === "yonma" && fourth === null) {
      throw new TypeError(
        "invalid or missing Firestore field: leagues.rule.uma.fourth",
      );
    }

    const fixedUma = {
      mode: "fixed" as const,
      first: requiredNumber(uma.first, "leagues.rule.uma.first"),
      second: requiredNumber(uma.second, "leagues.rule.uma.second"),
      third: requiredNumber(uma.third, "leagues.rule.uma.third"),
    };

    if (gameType === "sanma") {
      return {
        gameType,
        uma: { ...fixedUma, fourth: null },
        oka: mappedOka,
        chomboPenaltyPoints,
        allowOffTableKyotaku,
      } satisfies LeagueRule;
    }

    if (fourth === null) {
      throw new TypeError(
        "invalid or missing Firestore field: leagues.rule.uma.fourth",
      );
    }
    return {
      gameType,
      uma: { ...fixedUma, fourth },
      oka: mappedOka,
      chomboPenaltyPoints,
      allowOffTableKyotaku,
    } satisfies LeagueRule;
  }

  private toLeagueRuleDoc(rule: LeagueRule) {
    if (rule.uma.mode === "floatingCount") {
      return {
        game_type: rule.gameType,
        uma: {
          mode: "floating_count",
          points_by_floating_count: {
            "0": rule.uma.pointsByFloatingCount[0],
            "1": rule.uma.pointsByFloatingCount[1],
            "2": rule.uma.pointsByFloatingCount[2],
            "3": rule.uma.pointsByFloatingCount[3],
            "4": rule.uma.pointsByFloatingCount[4],
          },
        },
        oka: {
          starting_points: rule.oka.startingPoints,
          return_points: rule.oka.returnPoints,
        },
        chombo_penalty_points: rule.chomboPenaltyPoints,
        allow_off_table_kyotaku: rule.allowOffTableKyotaku,
      };
    }

    return {
      game_type: rule.gameType,
      uma: {
        mode: "fixed",
        first: rule.uma.first,
        second: rule.uma.second,
        third: rule.uma.third,
        fourth: rule.uma.fourth,
      },
      oka: {
        starting_points: rule.oka.startingPoints,
        return_points: rule.oka.returnPoints,
      },
      chombo_penalty_points: rule.chomboPenaltyPoints,
      allow_off_table_kyotaku: rule.allowOffTableKyotaku,
    };
  }
}
