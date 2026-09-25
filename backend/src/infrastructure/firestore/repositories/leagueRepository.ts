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
import { NotFoundError } from "@/domain/shared/errors.js";
import { asOpaqueId } from "@/domain/shared/types.js";

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
    const snapshot = await leagueRef.get();
    if (!snapshot.exists) {
      throw new NotFoundError("league not found", { leagueId });
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

    const batch = this.db.batch();
    batch.update(leagueRef, patch);

    if (input.memberUserIds !== undefined) {
      const users = await this.userRepository.getByIds(input.memberUserIds);
      const membersSnapshot = await leagueRef.collection("members").get();

      membersSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      users.forEach((user) => {
        const memberRef = leagueRef.collection("members").doc();
        batch.set(memberRef, {
          id: memberRef.id,
          user_id: user.id,
          user_name: user.name,
        });
      });
    }

    await batch.commit();
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

    return {
      gameType,
      uma: {
        first: requiredNumber(uma.first, "leagues.rule.uma.first"),
        second: requiredNumber(uma.second, "leagues.rule.uma.second"),
        third: requiredNumber(uma.third, "leagues.rule.uma.third"),
        fourth: nullableNumber(uma.fourth, "leagues.rule.uma.fourth"),
      },
      oka: {
        startingPoints: requiredNumber(
          oka.starting_points,
          "leagues.rule.oka.starting_points",
        ),
        returnPoints: requiredNumber(
          oka.return_points,
          "leagues.rule.oka.return_points",
        ),
      },
    } satisfies LeagueRule;
  }

  private toLeagueRuleDoc(rule: LeagueRule) {
    return {
      game_type: rule.gameType,
      uma: {
        first: rule.uma.first,
        second: rule.uma.second,
        third: rule.uma.third,
        fourth: rule.uma.fourth,
      },
      oka: {
        starting_points: rule.oka.startingPoints,
        return_points: rule.oka.returnPoints,
      },
    };
  }
}
