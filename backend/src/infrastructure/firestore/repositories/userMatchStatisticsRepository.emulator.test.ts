import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
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
  matchIndex: 1,
  playedAt: asIsoDateString("2026-01-01T00:00:00.000Z"),
  gameType: "yonma",
  playerCount: 4,
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
