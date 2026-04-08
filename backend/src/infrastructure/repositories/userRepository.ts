import { Timestamp, type Firestore } from "firebase-admin/firestore";
import type { JoiningSeason, User } from "@/domain/models.js";
import type { UserRepository } from "@/domain/repositories/userRepository.js";
import { toIsoString } from "@/infrastructure/firestore/utils.js";
import { NotFoundError } from "@/errors.js";

export class FirestoreUserRepository implements UserRepository {
  constructor(private readonly db: Firestore) {}

  async get(userId: string): Promise<User> {
    const snapshot = await this.db.collection("users").doc(userId).get();
    if (!snapshot.exists) {
      throw new NotFoundError("user not found", { userId });
    }

    return this.map(snapshot.id, snapshot.data() ?? {});
  }

  async getByIds(userIds: string[]): Promise<User[]> {
    if (userIds.length === 0) {
      return [];
    }

    const snapshots = await Promise.all(
      userIds.map((userId) => this.db.collection("users").doc(userId).get()),
    );
    return snapshots
      .filter((snapshot) => snapshot.exists)
      .map((snapshot) => this.map(snapshot.id, snapshot.data() ?? {}));
  }

  async search(query: string): Promise<User[]> {
    const snapshot = await this.db.collection("users").limit(50).get();
    const keyword = query.trim().toLowerCase();
    return snapshot.docs
      .map((doc) => this.map(doc.id, doc.data()))
      .filter(
        (user) =>
          keyword === "" || user.username.toLowerCase().includes(keyword),
      );
  }

  async listJoiningSeasons(userId: string): Promise<JoiningSeason[]> {
    const leaguesSnapshot = await this.db.collection("leagues").get();
    const result: JoiningSeason[] = [];

    for (const leagueDoc of leaguesSnapshot.docs) {
      const leagueMembersSnapshot = await leagueDoc.ref
        .collection("members")
        .where("user_id", "==", userId)
        .limit(1)
        .get();
      if (leagueMembersSnapshot.empty) {
        continue;
      }

      const seasonsSnapshot = await leagueDoc.ref.collection("seasons").get();
      seasonsSnapshot.docs.forEach((seasonDoc) => {
        const members = seasonDoc.data().members ?? [];
        if (
          Array.isArray(members) &&
          members.some((member) => member.user_id === userId)
        ) {
          result.push({
            leagueId: leagueDoc.id,
            leagueName: String(leagueDoc.data().name ?? ""),
            seasonId: seasonDoc.id,
            seasonName: String(seasonDoc.data().name ?? ""),
          });
        }
      });
    }

    return result.sort((left, right) =>
      left.leagueName.localeCompare(right.leagueName, "ja"),
    );
  }

  async upsertProfile(input: {
    userId: string;
    email: string | null;
    name: string;
    username: string;
  }): Promise<User> {
    const ref = this.db.collection("users").doc(input.userId);
    const snapshot = await ref.get();
    const now = Timestamp.now();

    if (!snapshot.exists) {
      await ref.set({
        id: input.userId,
        username: input.username,
        email: input.email ?? "",
        name: input.name,
        created_at: now,
        updated_at: now,
      });
    } else {
      await ref.update({
        username: input.username,
        email: input.email ?? "",
        name: input.name,
        updated_at: now,
      });
    }

    return this.get(input.userId);
  }

  async updateProfile(input: {
    userId: string;
    name?: string;
    username?: string;
  }): Promise<User> {
    const ref = this.db.collection("users").doc(input.userId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      throw new NotFoundError("user not found", { userId: input.userId });
    }

    const patch: Record<string, unknown> = {
      updated_at: Timestamp.now(),
    };

    if (input.name !== undefined) {
      patch.name = input.name;
    }
    if (input.username !== undefined) {
      patch.username = input.username;
    }

    await ref.update(patch);
    return this.get(input.userId);
  }

  private map(id: string, data: FirebaseFirestore.DocumentData): User {
    return {
      id,
      username: String(data.username ?? ""),
      email: String(data.email ?? ""),
      name: String(data.name ?? ""),
      createdAt: toIsoString(data.created_at),
      updatedAt: toIsoString(data.updated_at),
    };
  }
}
