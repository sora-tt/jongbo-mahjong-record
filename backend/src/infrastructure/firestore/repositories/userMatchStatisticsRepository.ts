import { createHash } from "node:crypto";
import {
  FieldPath,
  Timestamp,
  type DocumentData,
  type Firestore,
  type Query,
} from "firebase-admin/firestore";
import type { UserMatchStatisticsRepository } from "@/domain/statistics/repository.js";
import type { UserMatchStatistics } from "@/domain/statistics/types.js";

const COLLECTION = "user_match_statistics";
const WRITE_BATCH_SIZE = 400;

/** Stable for the same user, league, season, session, and match tuple. */
export const buildUserMatchStatisticsId = (
  row: Pick<
    UserMatchStatistics,
    "userId" | "leagueId" | "seasonId" | "sessionId" | "matchId"
  >,
) =>
  `ums_${createHash("sha256")
    .update(
      JSON.stringify([
        row.userId,
        row.leagueId,
        row.seasonId,
        row.sessionId,
        row.matchId,
      ]),
    )
    .digest("hex")}`;

const toFirestoreData = (row: UserMatchStatistics, id: string) => ({
  id,
  user_id: row.userId,
  user_name: row.userName,
  league_id: row.leagueId,
  league_name: row.leagueName,
  season_id: row.seasonId,
  season_name: row.seasonName,
  session_id: row.sessionId,
  session_label: row.sessionLabel,
  match_id: row.matchId,
  match_index: row.matchIndex,
  played_at: Timestamp.fromDate(new Date(row.playedAt)),
  game_type: row.gameType,
  player_count: row.playerCount,
  wind: row.wind,
  rank: row.rank,
  raw_score: row.rawScore,
  final_point: row.finalPoint,
  chombo_count: row.chomboCount,
  opponents: row.opponents.map((opponent) => ({
    user_id: opponent.userId,
    user_name: opponent.userName,
    rank: opponent.rank,
    final_point: opponent.finalPoint,
  })),
  updated_at: Timestamp.fromDate(new Date(row.updatedAt)),
});

export class FirestoreUserMatchStatisticsRepository implements UserMatchStatisticsRepository {
  constructor(private readonly db: Firestore) {}

  async replaceSeason(input: {
    leagueId: string;
    seasonId: string;
    rows: UserMatchStatistics[];
  }): Promise<void> {
    const projectionIds = new Set<string>();
    const preparedRows = input.rows.map((row) => {
      if (
        String(row.leagueId) !== input.leagueId ||
        String(row.seasonId) !== input.seasonId
      ) {
        throw new TypeError(
          "season replacement rows must belong to the requested league and season",
        );
      }

      const id = buildUserMatchStatisticsId(row);
      if (projectionIds.has(id)) {
        throw new TypeError(
          "season replacement contains a duplicate projection",
        );
      }
      projectionIds.add(id);
      return { id, row };
    });

    for (
      let offset = 0;
      offset < preparedRows.length;
      offset += WRITE_BATCH_SIZE
    ) {
      const batch = this.db.batch();
      preparedRows
        .slice(offset, offset + WRITE_BATCH_SIZE)
        .forEach(({ id, row }) => {
          batch.set(
            this.db.collection(COLLECTION).doc(id),
            toFirestoreData(row, id),
          );
        });
      await batch.commit();
    }

    const keepIds = new Set(projectionIds);
    await this.deleteMatching(
      this.db
        .collection(COLLECTION)
        .where("league_id", "==", input.leagueId)
        .where("season_id", "==", input.seasonId),
      (id) => !keepIds.has(id),
    );
  }

  async deleteSeason(leagueId: string, seasonId: string): Promise<void> {
    await this.deleteMatching(
      this.db
        .collection(COLLECTION)
        .where("league_id", "==", leagueId)
        .where("season_id", "==", seasonId),
      () => true,
    );
  }

  async deleteLeague(leagueId: string): Promise<void> {
    await this.deleteMatching(
      this.db.collection(COLLECTION).where("league_id", "==", leagueId),
      () => true,
    );
  }

  private async deleteMatching(
    scopedQuery: Query<DocumentData>,
    shouldDelete: (id: string) => boolean,
  ): Promise<void> {
    let page = await scopedQuery
      .orderBy(FieldPath.documentId())
      .limit(WRITE_BATCH_SIZE)
      .get();

    while (!page.empty) {
      const lastDocument = page.docs.at(-1);
      if (!lastDocument) {
        return;
      }

      const staleDocuments = page.docs.filter((doc) => shouldDelete(doc.id));
      if (staleDocuments.length > 0) {
        const batch = this.db.batch();
        staleDocuments.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }

      page = await scopedQuery
        .orderBy(FieldPath.documentId())
        .startAfter(lastDocument)
        .limit(WRITE_BATCH_SIZE)
        .get();
    }
  }
}
