import { createHash } from "node:crypto";
import {
  FieldPath,
  Timestamp,
  type DocumentData,
  type Firestore,
  type Query,
} from "firebase-admin/firestore";
import { asIsoDateString, asOpaqueId } from "@/domain/shared/types.js";
import type { UserMatchStatisticsRepository } from "@/domain/statistics/repository.js";
import type {
  StatisticsMatchPage,
  StatisticsScope,
  UserMatchStatistics,
} from "@/domain/statistics/types.js";
import {
  nullableString,
  requiredArray,
  requiredNumber,
  requiredObject,
  requiredString,
  toIsoString,
} from "@/infrastructure/firestore/utils.js";

const COLLECTION = "user_match_statistics";
const WRITE_BATCH_SIZE = 400;
const MAX_HISTORY_PAGE_SIZE = 100;
const HISTORY_ORDER = [
  ["played_at", "desc"],
  ["session_id", "desc"],
  ["match_index", "desc"],
  ["match_id", "desc"],
] as const;

type UserMatchStatisticsQuery = StatisticsScope & { userId: string };
type UserMatchStatisticsPageQuery = UserMatchStatisticsQuery & {
  limit: number;
  cursor?: string;
};

type HistoryCursor = {
  version: 1;
  query: string;
  playedAt: string;
  sessionId: string;
  matchIndex: number;
  matchId: string;
};

const cursorQueryKey = (query: UserMatchStatisticsQuery): string =>
  JSON.stringify({
    userId: query.userId,
    scopeType: query.scopeType,
    leagueId: query.scopeType === "overall" ? null : query.leagueId,
    seasonId: query.scopeType === "season" ? query.seasonId : null,
    from: query.from ?? null,
    to: query.to ?? null,
    gameType: query.gameType ?? "all",
  });

const toStatisticsScope = (
  query: UserMatchStatisticsQuery,
): StatisticsScope => {
  const filters = {
    ...(query.from ? { from: query.from } : {}),
    ...(query.to ? { to: query.to } : {}),
    ...(query.gameType ? { gameType: query.gameType } : {}),
  };

  if (query.scopeType === "overall") {
    return { ...filters, scopeType: "overall" };
  }
  if (query.scopeType === "league") {
    return {
      ...filters,
      scopeType: "league",
      leagueId: query.leagueId,
    };
  }
  return {
    ...filters,
    scopeType: "season",
    leagueId: query.leagueId,
    seasonId: query.seasonId,
  };
};

const encodeCursor = (
  queryKey: string,
  lastRow: Pick<
    UserMatchStatistics,
    "playedAt" | "sessionId" | "matchIndex" | "matchId"
  >,
): string =>
  Buffer.from(
    JSON.stringify({
      version: 1,
      query: queryKey,
      playedAt: lastRow.playedAt,
      sessionId: lastRow.sessionId,
      matchIndex: lastRow.matchIndex,
      matchId: lastRow.matchId,
    } satisfies HistoryCursor),
  ).toString("base64url");

const decodeCursor = (cursor: string, queryKey: string): HistoryCursor => {
  let value: unknown;
  try {
    value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
  } catch {
    throw new TypeError("invalid cursor");
  }

  if (typeof value !== "object" || value === null) {
    throw new TypeError("invalid cursor");
  }

  const decoded = value as Partial<HistoryCursor>;
  if (
    decoded.version !== 1 ||
    typeof decoded.query !== "string" ||
    typeof decoded.playedAt !== "string" ||
    typeof decoded.sessionId !== "string" ||
    typeof decoded.matchIndex !== "number" ||
    !Number.isFinite(decoded.matchIndex) ||
    typeof decoded.matchId !== "string"
  ) {
    throw new TypeError("invalid cursor");
  }
  if (decoded.query !== queryKey) {
    throw new TypeError("cursor does not match query");
  }

  return decoded as HistoryCursor;
};

const mapProjection = (id: string, data: DocumentData): UserMatchStatistics => {
  const gameType = requiredString(
    data.game_type,
    "user_match_statistics.game_type",
  );
  if (gameType !== "sanma" && gameType !== "yonma") {
    throw new TypeError(
      "invalid or missing Firestore field: user_match_statistics.game_type",
    );
  }
  const wind = requiredString(data.wind, "user_match_statistics.wind");
  if (
    wind !== "east" &&
    wind !== "south" &&
    wind !== "west" &&
    wind !== "north"
  ) {
    throw new TypeError(
      "invalid or missing Firestore field: user_match_statistics.wind",
    );
  }
  const playerCount = requiredNumber(
    data.player_count,
    "user_match_statistics.player_count",
  );
  if (playerCount !== 3 && playerCount !== 4) {
    throw new TypeError(
      "invalid or missing Firestore field: user_match_statistics.player_count",
    );
  }

  return {
    id: asOpaqueId(id),
    userId: asOpaqueId(
      requiredString(data.user_id, "user_match_statistics.user_id"),
    ),
    userName: requiredString(data.user_name, "user_match_statistics.user_name"),
    leagueId: asOpaqueId(
      requiredString(data.league_id, "user_match_statistics.league_id"),
    ),
    leagueName: requiredString(
      data.league_name,
      "user_match_statistics.league_name",
    ),
    seasonId: asOpaqueId(
      requiredString(data.season_id, "user_match_statistics.season_id"),
    ),
    seasonName: requiredString(
      data.season_name,
      "user_match_statistics.season_name",
    ),
    sessionId: asOpaqueId(
      requiredString(data.session_id, "user_match_statistics.session_id"),
    ),
    sessionLabel: nullableString(
      data.session_label,
      "user_match_statistics.session_label",
    ),
    matchId: asOpaqueId(
      requiredString(data.match_id, "user_match_statistics.match_id"),
    ),
    matchIndex: requiredNumber(
      data.match_index,
      "user_match_statistics.match_index",
    ),
    playedAt: toIsoString(data.played_at),
    gameType,
    playerCount,
    wind,
    rank: requiredNumber(data.rank, "user_match_statistics.rank"),
    rawScore: requiredNumber(data.raw_score, "user_match_statistics.raw_score"),
    finalPoint: requiredNumber(
      data.final_point,
      "user_match_statistics.final_point",
    ),
    chomboCount: requiredNumber(
      data.chombo_count,
      "user_match_statistics.chombo_count",
    ),
    opponents: requiredArray(
      data.opponents,
      "user_match_statistics.opponents",
    ).map((value) => {
      const opponent = requiredObject(
        value,
        "user_match_statistics.opponents[]",
      );
      return {
        userId: asOpaqueId(
          requiredString(
            opponent.user_id,
            "user_match_statistics.opponents[].user_id",
          ),
        ),
        userName: requiredString(
          opponent.user_name,
          "user_match_statistics.opponents[].user_name",
        ),
        rank: requiredNumber(
          opponent.rank,
          "user_match_statistics.opponents[].rank",
        ),
        finalPoint: requiredNumber(
          opponent.final_point,
          "user_match_statistics.opponents[].final_point",
        ),
      };
    }),
    updatedAt: toIsoString(data.updated_at),
  };
};

const toHistoryItem = (row: UserMatchStatistics) => ({
  match: {
    matchId: row.matchId,
    leagueId: row.leagueId,
    leagueName: row.leagueName,
    seasonId: row.seasonId,
    seasonName: row.seasonName,
    sessionId: row.sessionId,
    sessionLabel: row.sessionLabel,
    playedAt: row.playedAt,
  },
  gameType: row.gameType,
  wind: row.wind,
  rank: row.rank,
  rawScore: row.rawScore,
  finalPoint: row.finalPoint,
  opponents: row.opponents,
});

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

  async listForScope(
    query: UserMatchStatisticsQuery,
  ): Promise<UserMatchStatistics[]> {
    const snapshot = await this.buildScopedQuery(query)
      .orderBy(...HISTORY_ORDER[0])
      .orderBy(...HISTORY_ORDER[1])
      .orderBy(...HISTORY_ORDER[2])
      .orderBy(...HISTORY_ORDER[3])
      .get();
    return snapshot.docs.map((doc) => mapProjection(doc.id, doc.data()));
  }

  async listPage(
    query: UserMatchStatisticsPageQuery,
  ): Promise<StatisticsMatchPage> {
    if (
      !Number.isInteger(query.limit) ||
      query.limit < 1 ||
      query.limit > MAX_HISTORY_PAGE_SIZE
    ) {
      throw new TypeError(
        `limit must be between 1 and ${MAX_HISTORY_PAGE_SIZE}`,
      );
    }

    const queryKey = cursorQueryKey(query);
    const cursor = query.cursor
      ? decodeCursor(query.cursor, queryKey)
      : undefined;
    let scopedQuery = this.buildScopedQuery(query)
      .orderBy(...HISTORY_ORDER[0])
      .orderBy(...HISTORY_ORDER[1])
      .orderBy(...HISTORY_ORDER[2])
      .orderBy(...HISTORY_ORDER[3]);

    if (cursor) {
      scopedQuery = scopedQuery.startAfter(
        Timestamp.fromDate(new Date(cursor.playedAt)),
        cursor.sessionId,
        cursor.matchIndex,
        cursor.matchId,
      );
    }

    const snapshot = await scopedQuery.limit(query.limit + 1).get();
    const pageDocuments = snapshot.docs.slice(0, query.limit);
    const rows = pageDocuments.map((doc) => mapProjection(doc.id, doc.data()));
    const hasNextPage = snapshot.docs.length > query.limit;
    const lastRow = rows.at(-1);
    const nextCursor =
      hasNextPage && lastRow ? encodeCursor(queryKey, lastRow) : null;
    const generatedAt = asIsoDateString(new Date().toISOString());

    if (rows.length === 0) {
      return {
        status: "empty",
        scope: toStatisticsScope(query),
        generatedAt,
        timeZone: "Asia/Tokyo",
        items: [],
        nextCursor: null,
      };
    }

    return {
      status: "ready",
      scope: toStatisticsScope(query),
      generatedAt,
      timeZone: "Asia/Tokyo",
      items: rows.map(toHistoryItem),
      nextCursor,
    };
  }

  private buildScopedQuery(
    query: UserMatchStatisticsQuery,
  ): Query<DocumentData> {
    let scopedQuery: Query<DocumentData> = this.db
      .collection(COLLECTION)
      .where("user_id", "==", query.userId);

    if (query.scopeType !== "overall") {
      scopedQuery = scopedQuery.where("league_id", "==", query.leagueId);
    }
    if (query.scopeType === "season") {
      scopedQuery = scopedQuery.where("season_id", "==", query.seasonId);
    }
    if (query.from) {
      scopedQuery = scopedQuery.where(
        "played_at",
        ">=",
        Timestamp.fromDate(new Date(query.from)),
      );
    }
    if (query.to) {
      scopedQuery = scopedQuery.where(
        "played_at",
        "<",
        Timestamp.fromDate(new Date(query.to)),
      );
    }
    if (query.gameType && query.gameType !== "all") {
      scopedQuery = scopedQuery.where("game_type", "==", query.gameType);
    }

    return scopedQuery;
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
