import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { UserMatchStatisticsRepository } from "@/domain/statistics/repository.js";
import { asIsoDateString, asOpaqueId } from "@/domain/shared/types.js";
import type { UserMatchStatistics } from "@/domain/statistics/types.js";
import { getDb } from "@/infrastructure/firestore/client.js";
import { FirestoreUserMatchStatisticsRepository } from "@/infrastructure/firestore/repositories/userMatchStatisticsRepository.js";

const emulatorAvailable = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

const createProjection = (input: {
  userId: string;
  leagueId: string;
  seasonId: string;
  sessionId: string;
  matchId: string;
  finalPoint?: number;
  matchIndex?: number;
  playedAt?: string;
  gameType?: "sanma" | "yonma";
}): UserMatchStatistics => ({
  id: asOpaqueId("caller-provided-id"),
  userId: asOpaqueId(input.userId),
  userName: `user-${input.userId}`,
  leagueId: asOpaqueId(input.leagueId),
  leagueName: `league-${input.leagueId}`,
  seasonId: asOpaqueId(input.seasonId),
  seasonName: `season-${input.seasonId}`,
  sessionId: asOpaqueId(input.sessionId),
  sessionLabel: null,
  matchId: asOpaqueId(input.matchId),
  matchIndex: input.matchIndex ?? 1,
  playedAt: asIsoDateString(input.playedAt ?? "2026-01-01T00:00:00.000Z"),
  gameType: input.gameType ?? "yonma",
  playerCount: input.gameType === "sanma" ? 3 : 4,
  wind: "east",
  rank: 1,
  rawScore: 35000,
  finalPoint: input.finalPoint ?? 35,
  chomboCount: 0,
  opponents: [],
  updatedAt: asIsoDateString("2026-01-01T00:01:00.000Z"),
});

test(
  "replaces one season idempotently and prunes stale projections without touching other scopes",
  { skip: !emulatorAvailable },
  async () => {
    const db = getDb();
    const repository = new FirestoreUserMatchStatisticsRepository(db);
    const suffix = randomUUID();
    const leagueId = `projection-league-${suffix}`;
    const otherLeagueId = `projection-other-league-${suffix}`;
    const seasonId = `projection-season-${suffix}`;
    const siblingSeasonId = `projection-sibling-season-${suffix}`;
    const otherSeasonId = `projection-other-season-${suffix}`;
    const userId = `projection-user-${suffix}`;
    const otherUserId = `projection-other-user-${suffix}`;
    const sessionId = `projection-session-${suffix}`;
    const otherSessionId = `projection-other-session-${suffix}`;
    const siblingSessionId = `projection-sibling-session-${suffix}`;
    const matchId = `projection-match-${suffix}`;
    const staleMatchId = `projection-stale-match-${suffix}`;
    const otherMatchId = `projection-other-match-${suffix}`;
    const siblingMatchId = `projection-sibling-match-${suffix}`;
    const collection = db.collection("user_match_statistics");

    try {
      await repository.replaceSeason({
        leagueId: asOpaqueId(leagueId),
        seasonId: asOpaqueId(seasonId),
        rows: [
          createProjection({
            userId,
            leagueId,
            seasonId,
            sessionId,
            matchId,
          }),
          createProjection({
            userId: otherUserId,
            leagueId,
            seasonId,
            sessionId,
            matchId: staleMatchId,
          }),
        ],
      });
      await repository.replaceSeason({
        leagueId: asOpaqueId(leagueId),
        seasonId: asOpaqueId(siblingSeasonId),
        rows: [
          createProjection({
            userId: otherUserId,
            leagueId,
            seasonId: siblingSeasonId,
            sessionId: siblingSessionId,
            matchId: siblingMatchId,
          }),
        ],
      });
      await repository.replaceSeason({
        leagueId: asOpaqueId(otherLeagueId),
        seasonId: asOpaqueId(otherSeasonId),
        rows: [
          createProjection({
            userId: otherUserId,
            leagueId: otherLeagueId,
            seasonId: otherSeasonId,
            sessionId: otherSessionId,
            matchId: otherMatchId,
          }),
        ],
      });

      const firstSnapshot = await collection
        .where("league_id", "==", leagueId)
        .where("season_id", "==", seasonId)
        .get();
      assert.equal(firstSnapshot.size, 2);
      const firstProjection = firstSnapshot.docs.find(
        (doc) => doc.data().match_id === matchId,
      );
      assert.ok(firstProjection);

      await repository.replaceSeason({
        leagueId: asOpaqueId(leagueId),
        seasonId: asOpaqueId(seasonId),
        rows: [
          createProjection({
            userId,
            leagueId,
            seasonId,
            sessionId,
            matchId,
            finalPoint: 42,
          }),
        ],
      });

      const replacedSnapshot = await collection
        .where("league_id", "==", leagueId)
        .where("season_id", "==", seasonId)
        .get();
      assert.equal(replacedSnapshot.size, 1);
      assert.equal(replacedSnapshot.docs[0]?.id, firstProjection.id);
      assert.equal(replacedSnapshot.docs[0]?.data().id, firstProjection.id);
      assert.equal(replacedSnapshot.docs[0]?.data().final_point, 42);

      await repository.deleteSeason(asOpaqueId(leagueId), asOpaqueId(seasonId));
      assert.equal(
        (
          await collection
            .where("league_id", "==", leagueId)
            .where("season_id", "==", seasonId)
            .get()
        ).size,
        0,
      );
      assert.equal(
        (
          await collection
            .where("league_id", "==", leagueId)
            .where("season_id", "==", siblingSeasonId)
            .get()
        ).size,
        1,
      );

      await repository.deleteLeague(asOpaqueId(leagueId));
      assert.equal(
        (await collection.where("league_id", "==", leagueId).get()).size,
        0,
      );
      assert.equal(
        (
          await collection
            .where("league_id", "==", otherLeagueId)
            .where("season_id", "==", otherSeasonId)
            .get()
        ).size,
        1,
      );

      await repository.deleteLeague(asOpaqueId(otherLeagueId));
    } finally {
      await Promise.all([
        repository.deleteLeague(asOpaqueId(leagueId)),
        repository.deleteLeague(asOpaqueId(otherLeagueId)),
      ]);
    }
  },
);

test(
  "filters projections by target, scope, half-open date range and game type, then pages in stable descending order",
  { skip: !emulatorAvailable },
  async () => {
    const db = getDb();
    const repository = new FirestoreUserMatchStatisticsRepository(db);
    const suffix = randomUUID();
    const leagueId = `projection-query-league-${suffix}`;
    const otherLeagueId = `projection-query-other-league-${suffix}`;
    const seasonId = `projection-query-season-${suffix}`;
    const otherSeasonId = `projection-query-other-season-${suffix}`;
    const userId = `projection-query-user-${suffix}`;
    const otherUserId = `projection-query-other-user-${suffix}`;
    const playedAt = "2026-01-03T00:00:00.000Z";
    const from = "2026-01-02T00:00:00.000Z";
    const to = "2026-01-04T00:00:00.000Z";
    const rows = [
      createProjection({
        userId,
        leagueId,
        seasonId,
        sessionId: "z-session",
        matchId: "zz-match",
        matchIndex: 2,
        playedAt,
      }),
      createProjection({
        userId,
        leagueId,
        seasonId,
        sessionId: "z-session",
        matchId: "b-match",
        matchIndex: 1,
        playedAt,
      }),
      createProjection({
        userId,
        leagueId,
        seasonId,
        sessionId: "z-session",
        matchId: "a-match",
        matchIndex: 1,
        playedAt,
      }),
      createProjection({
        userId,
        leagueId,
        seasonId,
        sessionId: "a-session",
        matchId: "c-match",
        matchIndex: 1,
        playedAt,
      }),
      createProjection({
        userId,
        leagueId,
        seasonId,
        sessionId: "z-session",
        matchId: "at-to-match",
        playedAt: to,
      }),
      createProjection({
        userId,
        leagueId,
        seasonId,
        sessionId: "z-session",
        matchId: "before-from-match",
        playedAt: "2026-01-01T23:59:59.999Z",
      }),
      createProjection({
        userId,
        leagueId,
        seasonId,
        sessionId: "z-session",
        matchId: "at-from-match",
        playedAt: from,
      }),
      createProjection({
        userId,
        leagueId,
        seasonId,
        sessionId: "z-session",
        matchId: "sanma-match",
        gameType: "sanma",
        playedAt,
      }),
      createProjection({
        userId: otherUserId,
        leagueId,
        seasonId,
        sessionId: "z-session",
        matchId: "other-user-match",
        playedAt,
      }),
    ];

    try {
      await repository.replaceSeason({
        leagueId,
        seasonId,
        rows,
      });
      await repository.replaceSeason({
        leagueId,
        seasonId: otherSeasonId,
        rows: [
          createProjection({
            userId,
            leagueId,
            seasonId: otherSeasonId,
            sessionId: "other-season-session",
            matchId: "other-season-match",
            playedAt,
          }),
        ],
      });
      await repository.replaceSeason({
        leagueId: otherLeagueId,
        seasonId: otherSeasonId,
        rows: [
          createProjection({
            userId,
            leagueId: otherLeagueId,
            seasonId: otherSeasonId,
            sessionId: "other-league-session",
            matchId: "other-league-match",
            playedAt,
          }),
        ],
      });

      const query = {
        scopeType: "season" as const,
        leagueId: asOpaqueId(leagueId),
        seasonId: asOpaqueId(seasonId),
        from: asIsoDateString(from),
        to: asIsoDateString(to),
        gameType: "yonma" as const,
        userId: asOpaqueId(userId),
      };
      const expectedMatchIds = [
        "zz-match",
        "b-match",
        "a-match",
        "c-match",
        "at-from-match",
      ];
      const filteredRows = await repository.listForScope(query);
      assert.deepEqual(
        filteredRows.map((row) => row.matchId),
        expectedMatchIds,
      );

      const firstPage = await repository.listPage({ ...query, limit: 2 });
      assert.deepEqual(
        firstPage.items.map((item) => item.match.matchId),
        expectedMatchIds.slice(0, 2),
      );
      assert.ok(firstPage.nextCursor);

      const secondPage = await repository.listPage({
        ...query,
        limit: 2,
        cursor: firstPage.nextCursor,
      });
      assert.deepEqual(
        secondPage.items.map((item) => item.match.matchId),
        expectedMatchIds.slice(2, 4),
      );
      assert.ok(secondPage.nextCursor);

      const thirdPage = await repository.listPage({
        ...query,
        limit: 2,
        cursor: secondPage.nextCursor,
      });
      assert.deepEqual(
        thirdPage.items.map((item) => item.match.matchId),
        expectedMatchIds.slice(4),
      );
      assert.equal(thirdPage.nextCursor, null);

      const allPages = [
        ...firstPage.items,
        ...secondPage.items,
        ...thirdPage.items,
      ];
      assert.equal(new Set(allPages.map((item) => item.match.matchId)).size, 5);
      assert.equal(allPages.length, expectedMatchIds.length);
      await assert.rejects(
        repository.listPage({
          ...query,
          from: asIsoDateString("2026-01-01T00:00:00.000Z"),
          limit: 2,
          cursor: firstPage.nextCursor ?? undefined,
        }),
        /cursor does not match query/,
      );
    } finally {
      await Promise.all([
        repository.deleteLeague(asOpaqueId(leagueId)),
        repository.deleteLeague(asOpaqueId(otherLeagueId)),
      ]);
    }
  },
);

const projection = (input: {
  userId: string;
  leagueId: string;
  seasonId: string;
  sessionId: string;
  matchId: string;
  matchIndex: number;
  playedAt: string;
  gameType?: "sanma" | "yonma";
  finalPoint?: number;
}): UserMatchStatistics => {
  const gameType = input.gameType ?? "yonma";
  const playerCount = gameType === "sanma" ? 3 : 4;
  return {
    id: asOpaqueId(`row-${input.userId}-${input.matchId}`),
    userId: asOpaqueId(input.userId),
    userName: input.userId,
    leagueId: asOpaqueId(input.leagueId),
    leagueName: input.leagueId,
    seasonId: asOpaqueId(input.seasonId),
    seasonName: input.seasonId,
    sessionId: asOpaqueId(input.sessionId),
    sessionLabel: input.sessionId,
    matchId: asOpaqueId(input.matchId),
    matchIndex: input.matchIndex,
    playedAt: asIsoDateString(input.playedAt),
    gameType,
    playerCount,
    wind: gameType === "sanma" ? "east" : "north",
    rank: playerCount,
    rawScore: 25_000,
    finalPoint: input.finalPoint ?? 0,
    chomboCount: 0,
    opponents: [],
    updatedAt: asIsoDateString(input.playedAt),
  };
};

test(
  "replaces projections idempotently, prunes stale rows, and pages history in stable filtered order",
  { skip: !emulatorAvailable },
  async () => {
    const db = getDb();
    const repository: UserMatchStatisticsRepository =
      new FirestoreUserMatchStatisticsRepository(db);
    const suffix = randomUUID();
    const leagueId = `statistics-repository-${suffix}`;
    const otherLeagueId = `statistics-repository-other-${suffix}`;
    const seasonId = `season-${suffix}`;
    const otherSeasonId = `other-season-${suffix}`;
    const userId = `user-${suffix}`;
    const otherUserId = `other-user-${suffix}`;
    const playedAt = "2026-01-01T00:00:00.000Z";

    const orderedRows = [
      projection({
        userId,
        leagueId,
        seasonId,
        sessionId: "session-b",
        matchId: "match-z",
        matchIndex: 2,
        playedAt,
        finalPoint: 20,
      }),
      projection({
        userId,
        leagueId,
        seasonId,
        sessionId: "session-b",
        matchId: "match-a",
        matchIndex: 2,
        playedAt,
        finalPoint: 10,
      }),
      projection({
        userId,
        leagueId,
        seasonId,
        sessionId: "session-b",
        matchId: "match-middle",
        matchIndex: 1,
        playedAt,
      }),
      projection({
        userId,
        leagueId,
        seasonId,
        sessionId: "session-a",
        matchId: "match-session-a",
        matchIndex: 1,
        playedAt,
      }),
    ];
    const filteredOutRows = [
      projection({
        userId,
        leagueId,
        seasonId,
        sessionId: "session-b",
        matchId: "match-before-range",
        matchIndex: 3,
        playedAt: "2025-12-31T23:59:59.000Z",
      }),
      projection({
        userId,
        leagueId,
        seasonId,
        sessionId: "session-c",
        matchId: "match-sanma",
        matchIndex: 1,
        playedAt,
        gameType: "sanma",
      }),
      projection({
        userId: otherUserId,
        leagueId,
        seasonId,
        sessionId: "session-b",
        matchId: "match-other-user",
        matchIndex: 4,
        playedAt,
      }),
    ];
    const seasonRows = [...orderedRows, ...filteredOutRows];
    const otherSeasonRow = projection({
      userId,
      leagueId,
      seasonId: otherSeasonId,
      sessionId: "session-other-season",
      matchId: "match-other-season",
      matchIndex: 1,
      playedAt,
    });
    const otherLeagueRow = projection({
      userId,
      leagueId: otherLeagueId,
      seasonId,
      sessionId: "session-other-league",
      matchId: "match-other-league",
      matchIndex: 1,
      playedAt,
    });

    try {
      await repository.replaceSeason({ leagueId, seasonId, rows: seasonRows });
      await repository.replaceSeason({ leagueId, seasonId, rows: seasonRows });
      await repository.replaceSeason({
        leagueId,
        seasonId: otherSeasonId,
        rows: [otherSeasonRow],
      });
      await repository.replaceSeason({
        leagueId: otherLeagueId,
        seasonId,
        rows: [otherLeagueRow],
      });

      const query = {
        scopeType: "season" as const,
        leagueId: asOpaqueId(leagueId),
        seasonId: asOpaqueId(seasonId),
        userId,
        from: asIsoDateString("2026-01-01T00:00:00.000Z"),
        to: asIsoDateString("2026-01-02T00:00:00.000Z"),
        gameType: "yonma" as const,
        limit: 2,
      };
      const firstPage = await repository.listPage(query);
      assert.equal(firstPage.status, "ready");
      assert.deepEqual(
        firstPage.items.map(({ match: item }) => item.matchId),
        ["match-z", "match-a"],
      );
      assert.ok(firstPage.nextCursor);

      const secondPage = await repository.listPage({
        ...query,
        cursor: firstPage.nextCursor,
      });
      assert.equal(secondPage.status, "ready");
      assert.deepEqual(
        secondPage.items.map(({ match: item }) => item.matchId),
        ["match-middle", "match-session-a"],
      );
      assert.equal(secondPage.nextCursor, null);
      await assert.rejects(
        repository.listPage({
          ...query,
          gameType: "sanma",
          cursor: firstPage.nextCursor,
        }),
        /cursor does not match query/,
      );

      const updatedFirstRow = { ...orderedRows[0]!, finalPoint: 99 };
      await repository.replaceSeason({
        leagueId,
        seasonId,
        rows: [updatedFirstRow, ...orderedRows.slice(1), ...filteredOutRows],
      });
      const afterIdempotentUpdate = await repository.listForScope({
        scopeType: "season",
        leagueId: asOpaqueId(leagueId),
        seasonId: asOpaqueId(seasonId),
        userId,
      });
      assert.equal(afterIdempotentUpdate.length, 6);
      assert.equal(
        afterIdempotentUpdate.find(({ matchId }) => matchId === "match-z")
          ?.finalPoint,
        99,
      );

      await repository.replaceSeason({
        leagueId,
        seasonId,
        rows: [updatedFirstRow, filteredOutRows[2]!],
      });
      assert.deepEqual(
        (
          await repository.listForScope({
            scopeType: "season",
            leagueId: asOpaqueId(leagueId),
            seasonId: asOpaqueId(seasonId),
            userId,
          })
        ).map(({ matchId }) => matchId),
        ["match-z"],
      );
      assert.deepEqual(
        (
          await repository.listForScope({
            scopeType: "season",
            leagueId: asOpaqueId(leagueId),
            seasonId: asOpaqueId(seasonId),
            userId: otherUserId,
          })
        ).map(({ matchId }) => matchId),
        ["match-other-user"],
      );
      assert.deepEqual(
        (
          await repository.listForScope({
            scopeType: "league",
            leagueId: asOpaqueId(leagueId),
            userId,
          })
        ).map(({ matchId }) => matchId),
        ["match-other-season", "match-z"],
      );
      assert.deepEqual(
        (await repository.listForScope({ scopeType: "overall", userId })).map(
          ({ matchId }) => matchId,
        ),
        ["match-other-season", "match-other-league", "match-z"],
      );

      await repository.deleteSeason(leagueId, seasonId);
      assert.deepEqual(
        await repository.listForScope({
          scopeType: "season",
          leagueId: asOpaqueId(leagueId),
          seasonId: asOpaqueId(seasonId),
          userId,
        }),
        [],
      );
      assert.deepEqual(
        (
          await repository.listForScope({
            scopeType: "league",
            leagueId: asOpaqueId(leagueId),
            userId,
          })
        ).map(({ matchId }) => matchId),
        ["match-other-season"],
      );

      await repository.deleteLeague(leagueId);
      assert.deepEqual(
        await repository.listForScope({
          scopeType: "league",
          leagueId: asOpaqueId(leagueId),
          userId,
        }),
        [],
      );
      assert.deepEqual(
        (await repository.listForScope({ scopeType: "overall", userId })).map(
          ({ matchId }) => matchId,
        ),
        ["match-other-league"],
      );
    } finally {
      await Promise.all([
        repository.deleteLeague(leagueId),
        repository.deleteLeague(otherLeagueId),
      ]);
    }
  },
);
