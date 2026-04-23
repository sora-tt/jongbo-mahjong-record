import { Timestamp, type Firestore } from "firebase-admin/firestore";
import type {
  LeagueDetail,
  LeagueMember,
  LeagueSummary,
} from "@/domain/league/types.js";
import type {
  CreateLeagueInput,
  LeagueRepository,
  UpdateLeagueInput,
} from "@/domain/league/repository.js";
import type { Rule } from "@/domain/rule/types.js";
import type { UserRepository } from "@/domain/user/repository.js";
import { toIsoString } from "@/infrastructure/firestore/utils.js";
import { NotFoundError } from "@/domain/shared/errors.js";

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
        const data = doc.data() ?? {};
        const myStanding = data.active_season_id
          ? await this.findMyStanding(
              doc.id,
              data.active_season_id,
              memberUserId ?? "",
            )
          : null;

        return {
          id: doc.id,
          name: String(data.name ?? ""),
          rule: {
            id: String(data.rule_id ?? ""),
            name: String(data.rule_name ?? ""),
          },
          memberCount: Number(data.member_count ?? 0),
          totalMatchCount: Number(data.total_match_count ?? 0),
          activeSeason:
            data.active_season_id && data.active_season_name
              ? {
                  id: String(data.active_season_id),
                  name: String(data.active_season_name),
                }
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
    const data = snapshot.data() ?? {};

    return {
      id: snapshot.id,
      name: String(data.name ?? ""),
      rule: {
        id: String(data.rule_id ?? ""),
        name: String(data.rule_name ?? ""),
      },
      memberCount: Number(data.member_count ?? 0),
      totalMatchCount: Number(data.total_match_count ?? 0),
      activeSeason:
        data.active_season_id && data.active_season_name
          ? {
              id: String(data.active_season_id),
              name: String(data.active_season_name),
            }
          : null,
      members,
      leagueRecords: data.league_records
        ? {
            winStreak: this.mapRecordHolder(data.league_records.win_streak),
            loseStreak: this.mapRecordHolder(data.league_records.lose_streak),
            highestScore: this.mapRecordHolder(
              data.league_records.highest_score,
            ),
            lowestScore: this.mapRecordHolder(data.league_records.lowest_score),
          }
        : null,
      createdAt: toIsoString(data.created_at),
      updatedAt: toIsoString(data.updated_at),
    };
  }

  async create(input: CreateLeagueInput, rule: Rule): Promise<LeagueDetail> {
    const now = Timestamp.now();
    const leagueRef = this.db.collection("leagues").doc();
    const members = await this.userRepository.getByIds(input.memberUserIds);
    const batch = this.db.batch();

    batch.set(leagueRef, {
      id: leagueRef.id,
      name: input.name,
      rule_id: rule.id,
      rule_name: rule.name,
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

    await leagueRef.update(patch);
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
      id: doc.id,
      userId: String(doc.data().user_id ?? ""),
      userName: String(doc.data().user_name ?? ""),
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

  private async findLeagueDocsByMember(memberUserId: string) {
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

    const standings = seasonSnapshot.data()?.standings ?? [];
    const standing = Array.isArray(standings)
      ? standings.find((item) => item.user_id === memberUserId)
      : undefined;

    if (!standing) {
      return null;
    }

    return {
      rank: Number(standing.rank ?? null),
      totalPoints: Number(standing.total_points ?? 0),
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
