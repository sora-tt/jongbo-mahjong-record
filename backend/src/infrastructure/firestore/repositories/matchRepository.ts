import { Timestamp, type Firestore } from "firebase-admin/firestore";
import type { Match, MatchResult } from "@/domain/match/types.js";
import type { MatchRepository } from "@/domain/match/repository.js";
import { toIsoString, toTimestamp } from "@/infrastructure/firestore/utils.js";
import { NotFoundError } from "@/domain/shared/errors.js";

export class FirestoreMatchRepository implements MatchRepository {
  constructor(private readonly db: Firestore) {}

  async list(
    leagueId: string,
    seasonId: string,
    sessionId: string,
  ): Promise<Match[]> {
    const snapshot = await this.collection(leagueId, seasonId, sessionId)
      .orderBy("match_index", "asc")
      .get();
    return snapshot.docs.map((doc) =>
      this.map(leagueId, seasonId, sessionId, doc.id, doc.data()),
    );
  }

  async listBySeason(leagueId: string, seasonId: string): Promise<Match[]> {
    const sessionsSnapshot = await this.db
      .collection("leagues")
      .doc(leagueId)
      .collection("seasons")
      .doc(seasonId)
      .collection("sessions")
      .get();

    const matches = await Promise.all(
      sessionsSnapshot.docs.map(async (sessionDoc) => {
        const snapshot = await sessionDoc.ref.collection("matches").get();
        return snapshot.docs.map((doc) =>
          this.map(leagueId, seasonId, sessionDoc.id, doc.id, doc.data()),
        );
      }),
    );

    return matches.flat();
  }

  async listByLeague(leagueId: string): Promise<Match[]> {
    const seasonsSnapshot = await this.db
      .collection("leagues")
      .doc(leagueId)
      .collection("seasons")
      .get();
    const perSeason = await Promise.all(
      seasonsSnapshot.docs.map((seasonDoc) =>
        this.listBySeason(leagueId, seasonDoc.id),
      ),
    );
    return perSeason.flat();
  }

  async listAll(): Promise<Match[]> {
    const leaguesSnapshot = await this.db.collection("leagues").get();
    const perLeague = await Promise.all(
      leaguesSnapshot.docs.map((leagueDoc) => this.listByLeague(leagueDoc.id)),
    );
    return perLeague.flat();
  }

  async get(
    leagueId: string,
    seasonId: string,
    sessionId: string,
    matchId: string,
  ): Promise<Match> {
    const snapshot = await this.collection(leagueId, seasonId, sessionId)
      .doc(matchId)
      .get();
    if (!snapshot.exists) {
      throw new NotFoundError("match not found", {
        leagueId,
        seasonId,
        sessionId,
        matchId,
      });
    }

    return this.map(
      leagueId,
      seasonId,
      sessionId,
      snapshot.id,
      snapshot.data() ?? {},
    );
  }

  async create(params: {
    leagueId: string;
    seasonId: string;
    sessionId: string;
    playedAt: string;
    results: MatchResult[];
  }): Promise<Match> {
    const collection = this.collection(
      params.leagueId,
      params.seasonId,
      params.sessionId,
    );
    const existing = await collection
      .orderBy("match_index", "desc")
      .limit(1)
      .get();
    const lastMatchIndex = existing.empty
      ? 0
      : Number(existing.docs[0].data().match_index ?? 0);
    const ref = collection.doc();
    const now = Timestamp.now();

    await ref.set({
      id: ref.id,
      match_index: lastMatchIndex + 1,
      played_at: toTimestamp(params.playedAt),
      results: params.results.map((result) => ({
        user_id: result.userId,
        user_name: result.userName,
        wind: result.wind,
        rank: result.rank,
        raw_score: result.rawScore,
        point: result.point,
      })),
      created_at: now,
      updated_at: now,
    });

    return this.get(params.leagueId, params.seasonId, params.sessionId, ref.id);
  }

  async update(params: {
    leagueId: string;
    seasonId: string;
    sessionId: string;
    matchId: string;
    playedAt?: string;
    results?: MatchResult[];
  }): Promise<Match> {
    const ref = this.collection(
      params.leagueId,
      params.seasonId,
      params.sessionId,
    ).doc(params.matchId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      throw new NotFoundError("match not found", params);
    }

    const patch: Record<string, unknown> = { updated_at: Timestamp.now() };
    if (params.playedAt !== undefined) {
      patch.played_at = toTimestamp(params.playedAt);
    }
    if (params.results !== undefined) {
      patch.results = params.results.map((result) => ({
        user_id: result.userId,
        user_name: result.userName,
        wind: result.wind,
        rank: result.rank,
        raw_score: result.rawScore,
        point: result.point,
      }));
    }

    await ref.update(patch);
    return this.get(
      params.leagueId,
      params.seasonId,
      params.sessionId,
      params.matchId,
    );
  }

  async delete(
    leagueId: string,
    seasonId: string,
    sessionId: string,
    matchId: string,
  ): Promise<void> {
    const ref = this.collection(leagueId, seasonId, sessionId).doc(matchId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      throw new NotFoundError("match not found", {
        leagueId,
        seasonId,
        sessionId,
        matchId,
      });
    }

    await ref.delete();
  }

  private collection(leagueId: string, seasonId: string, sessionId: string) {
    return this.db
      .collection("leagues")
      .doc(leagueId)
      .collection("seasons")
      .doc(seasonId)
      .collection("sessions")
      .doc(sessionId)
      .collection("matches");
  }

  private map(
    leagueId: string,
    seasonId: string,
    sessionId: string,
    matchId: string,
    data: FirebaseFirestore.DocumentData,
  ): Match {
    return {
      id: matchId,
      leagueId,
      seasonId,
      sessionId,
      matchIndex: Number(data.match_index ?? 0),
      playedAt: toIsoString(data.played_at),
      results: Array.isArray(data.results)
        ? data.results.map((result) => ({
            userId: String(result.user_id ?? ""),
            userName: String(result.user_name ?? ""),
            wind: result.wind,
            rank: Number(result.rank ?? 0),
            rawScore: Number(result.raw_score ?? 0),
            point: Number(result.point ?? 0),
          }))
        : [],
      createdAt: toIsoString(data.created_at),
      updatedAt: toIsoString(data.updated_at),
    };
  }
}
