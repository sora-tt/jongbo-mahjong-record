import { Timestamp, type Firestore } from "firebase-admin/firestore";
import type { CreateSessionInput, Session, UpdateSessionInput } from "@/domain/models.js";
import type { SessionRepository } from "@/domain/repositories/sessionRepository.js";
import { toIsoString, toTimestamp } from "@/infrastructure/firestore/utils.js";
import { NotFoundError } from "@/errors.js";

export class FirestoreSessionRepository implements SessionRepository {
  constructor(private readonly db: Firestore) {}

  async list(leagueId: string, seasonId: string): Promise<Session[]> {
    const snapshot = await this.collection(leagueId, seasonId).orderBy("started_at", "desc").get();
    return snapshot.docs.map((doc) => this.map(leagueId, seasonId, doc.id, doc.data()));
  }

  async get(leagueId: string, seasonId: string, sessionId: string): Promise<Session> {
    const snapshot = await this.collection(leagueId, seasonId).doc(sessionId).get();
    if (!snapshot.exists) {
      throw new NotFoundError("session not found", { leagueId, seasonId, sessionId });
    }

    return this.map(leagueId, seasonId, snapshot.id, snapshot.data() ?? {});
  }

  async create(leagueId: string, seasonId: string, input: CreateSessionInput, members: Session["members"]): Promise<Session> {
    const ref = this.collection(leagueId, seasonId).doc();
    const now = Timestamp.now();
    await ref.set({
      id: ref.id,
      started_at: toTimestamp(input.startedAt),
      ended_at: toTimestamp(input.endedAt ?? null),
      members: members.map((member) => ({
        user_id: member.userId,
        user_name: member.userName,
      })),
      member_count: members.length,
      total_match_count: 0,
      table_label: input.tableLabel ?? null,
      created_by: input.createdBy,
      created_at: now,
      updated_at: now,
    });

    return this.get(leagueId, seasonId, ref.id);
  }

  async update(leagueId: string, seasonId: string, sessionId: string, input: UpdateSessionInput): Promise<Session> {
    const ref = this.collection(leagueId, seasonId).doc(sessionId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      throw new NotFoundError("session not found", { leagueId, seasonId, sessionId });
    }

    const patch: Record<string, unknown> = { updated_at: Timestamp.now() };
    if (input.endedAt !== undefined) {
      patch.ended_at = toTimestamp(input.endedAt);
    }
    if (input.tableLabel !== undefined) {
      patch.table_label = input.tableLabel;
    }

    await ref.update(patch);
    return this.get(leagueId, seasonId, sessionId);
  }

  async delete(leagueId: string, seasonId: string, sessionId: string): Promise<void> {
    const ref = this.collection(leagueId, seasonId).doc(sessionId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      throw new NotFoundError("session not found", { leagueId, seasonId, sessionId });
    }

    await this.db.recursiveDelete(ref);
  }

  async setTotalMatchCount(leagueId: string, seasonId: string, sessionId: string, totalMatchCount: number): Promise<void> {
    await this.collection(leagueId, seasonId).doc(sessionId).update({
      total_match_count: totalMatchCount,
      updated_at: Timestamp.now(),
    });
  }

  private collection(leagueId: string, seasonId: string) {
    return this.db.collection("leagues").doc(leagueId).collection("seasons").doc(seasonId).collection("sessions");
  }

  private map(leagueId: string, seasonId: string, sessionId: string, data: FirebaseFirestore.DocumentData): Session {
    return {
      id: sessionId,
      leagueId,
      seasonId,
      startedAt: toIsoString(data.started_at),
      endedAt: data.ended_at ? toIsoString(data.ended_at) : null,
      members: Array.isArray(data.members)
        ? data.members.map((member) => ({
            userId: String(member.user_id ?? ""),
            userName: String(member.user_name ?? ""),
          }))
        : [],
      memberCount: Number(data.member_count ?? 0),
      totalMatchCount: Number(data.total_match_count ?? 0),
      tableLabel: data.table_label ?? null,
      createdBy: String(data.created_by ?? ""),
      createdAt: toIsoString(data.created_at),
      updatedAt: toIsoString(data.updated_at),
    };
  }
}
