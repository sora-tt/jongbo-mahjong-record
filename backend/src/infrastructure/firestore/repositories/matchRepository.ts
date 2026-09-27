import { Timestamp, type Firestore } from "firebase-admin/firestore";
import type { Match, MatchResult } from "@/domain/match/types.js";
import type { MatchRepository } from "@/domain/match/repository.js";
import {
  requiredArray,
  requiredNumber,
  requiredObject,
  requiredString,
  toIsoString,
  toTimestamp,
} from "@/infrastructure/firestore/utils.js";
import { NotFoundError } from "@/domain/shared/errors.js";
import { asOpaqueId } from "@/domain/shared/types.js";

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
    const ref = collection.doc();
    const sessionRef = this.db
      .collection("leagues")
      .doc(params.leagueId)
      .collection("seasons")
      .doc(params.seasonId)
      .collection("sessions")
      .doc(params.sessionId);
    const leagueRef = this.db.collection("leagues").doc(params.leagueId);

    await this.db.runTransaction(async (transaction) => {
      const sessionSnapshot = await transaction.get(sessionRef);
      const leagueSnapshot = await transaction.get(leagueRef);
      if (!sessionSnapshot.exists) {
        throw new NotFoundError("session not found", {
          leagueId: params.leagueId,
          seasonId: params.seasonId,
          sessionId: params.sessionId,
        });
      }
      if (!leagueSnapshot.exists) {
        throw new NotFoundError("league not found", {
          leagueId: params.leagueId,
        });
      }

      const existing = await transaction.get(
        collection.orderBy("match_index", "desc").limit(1),
      );
      const lastMatchIndex = existing.empty
        ? 0
        : requiredNumber(
            existing.docs[0].data().match_index,
            "matches.match_index",
          );
      const sessionData = sessionSnapshot.data() ?? {};
      const totalMatchCount = requiredNumber(
        sessionData.total_match_count,
        "sessions.total_match_count",
      );
      const now = Timestamp.now();

      transaction.set(ref, {
        id: ref.id,
        match_index: lastMatchIndex + 1,
        played_at: toTimestamp(params.playedAt),
        results: this.toResultsDoc(params.results),
        created_at: now,
        updated_at: now,
      });
      transaction.update(sessionRef, {
        total_match_count: totalMatchCount + 1,
        updated_at: now,
      });
      transaction.update(leagueRef, {
        rule_locked: true,
        updated_at: now,
      });
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
    const sessionRef = this.db
      .collection("leagues")
      .doc(leagueId)
      .collection("seasons")
      .doc(seasonId)
      .collection("sessions")
      .doc(sessionId);

    await this.db.runTransaction(async (transaction) => {
      const sessionSnapshot = await transaction.get(sessionRef);
      const matchSnapshot = await transaction.get(ref);
      if (!matchSnapshot.exists) {
        throw new NotFoundError("match not found", {
          leagueId,
          seasonId,
          sessionId,
          matchId,
        });
      }
      if (!sessionSnapshot.exists) {
        throw new NotFoundError("session not found", {
          leagueId,
          seasonId,
          sessionId,
        });
      }

      const remainingMatches = await transaction.get(
        this.collection(leagueId, seasonId, sessionId),
      );
      const now = Timestamp.now();
      transaction.delete(ref);
      transaction.update(sessionRef, {
        total_match_count: Math.max(0, remainingMatches.size - 1),
        updated_at: now,
      });
    });
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

  private toResultsDoc(results: MatchResult[]) {
    return results.map((result) => ({
      user_id: result.userId,
      user_name: result.userName,
      wind: result.wind,
      rank: result.rank,
      raw_score: result.rawScore,
      point: result.point,
    }));
  }

  private map(
    leagueId: string,
    seasonId: string,
    sessionId: string,
    matchId: string,
    data: FirebaseFirestore.DocumentData,
  ): Match {
    const results = requiredArray(data.results, "matches.results").map(
      (value) => {
        const result = requiredObject(value, "matches.results[]");
        const wind = requiredString(result.wind, "matches.results[].wind");
        if (!["east", "south", "west", "north"].includes(wind)) {
          throw new TypeError(
            "invalid or missing Firestore field: matches.results[].wind",
          );
        }

        const normalizedWind = wind as MatchResult["wind"];

        return {
          userId: asOpaqueId(
            requiredString(result.user_id, "matches.results[].user_id"),
          ),
          userName: requiredString(
            result.user_name,
            "matches.results[].user_name",
          ),
          wind: normalizedWind,
          rank: requiredNumber(result.rank, "matches.results[].rank"),
          rawScore: requiredNumber(
            result.raw_score,
            "matches.results[].raw_score",
          ),
          point: requiredNumber(result.point, "matches.results[].point"),
        } satisfies MatchResult;
      },
    );

    return {
      id: asOpaqueId(matchId),
      leagueId: asOpaqueId(leagueId),
      seasonId: asOpaqueId(seasonId),
      sessionId: asOpaqueId(sessionId),
      matchIndex: requiredNumber(data.match_index, "matches.match_index"),
      playedAt: toIsoString(data.played_at),
      results,
      createdAt: toIsoString(data.created_at),
      updatedAt: toIsoString(data.updated_at),
    };
  }
}
