import assert from "node:assert/strict";
import test from "node:test";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/infrastructure/firestore/client.js";
import { FirestoreMatchRepository } from "@/infrastructure/firestore/repositories/matchRepository.js";
import { asOpaqueId } from "@/domain/shared/types.js";

const emulatorAvailable = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

test(
  "allocates unique match indexes in a transaction and preserves gaps after delete",
  { skip: !emulatorAvailable },
  async () => {
    const db = getDb();
    const repository = new FirestoreMatchRepository(db);
    const leagueId = "000000";
    const seasonId = "0001";
    const sessionId = "transaction-test-session";
    const leagueRef = db.collection("leagues").doc(leagueId);
    const sessionRef = leagueRef
      .collection("seasons")
      .doc(seasonId)
      .collection("sessions")
      .doc(sessionId);

    await leagueRef.set({ rule_locked: false });
    await sessionRef.set({ total_match_count: 0 });
    const results = [
      {
        userId: asOpaqueId("0001"),
        userName: "岩田",
        wind: "east" as const,
        rank: 1,
        rawScore: 35000,
        point: 45,
      },
    ];

    try {
      const [first, second] = await Promise.all([
        repository.create({
          leagueId,
          seasonId,
          sessionId,
          playedAt: "2026-01-01T00:00:00.000Z",
          results,
        }),
        repository.create({
          leagueId,
          seasonId,
          sessionId,
          playedAt: "2026-01-01T00:01:00.000Z",
          results,
        }),
      ]);

      assert.deepEqual(
        [first.matchIndex, second.matchIndex].sort(
          (left, right) => left - right,
        ),
        [1, 2],
      );
      assert.equal((await sessionRef.get()).data()?.total_match_count, 2);

      const matchToDelete = first.matchIndex === 1 ? first : second;
      await repository.delete(leagueId, seasonId, sessionId, matchToDelete.id);
      const third = await repository.create({
        leagueId,
        seasonId,
        sessionId,
        playedAt: "2026-01-01T00:02:00.000Z",
        results,
      });

      assert.equal(third.matchIndex, 3);
      assert.equal((await sessionRef.get()).data()?.total_match_count, 2);
    } finally {
      await db.recursiveDelete(leagueRef);
    }
  },
);

test(
  "persists Match yakuman events and distinguishes omitted, empty, and legacy values",
  { skip: !emulatorAvailable },
  async () => {
    const db = getDb();
    const repository = new FirestoreMatchRepository(db);
    const leagueId = "yakuman-record-contract-league";
    const seasonId = "yakuman-record-contract-season";
    const sessionId = "yakuman-record-contract-session";
    const leagueRef = db.collection("leagues").doc(leagueId);
    const sessionRef = leagueRef
      .collection("seasons")
      .doc(seasonId)
      .collection("sessions")
      .doc(sessionId);
    const results = [
      {
        userId: asOpaqueId("winner-1"),
        userName: "和了者",
        wind: "east" as const,
        rank: 1,
        rawScore: 35000,
        point: 45,
      },
    ];
    const yakumanEvents = [
      { winnerUserId: "winner-1", kind: "suuankouTanki" as const },
      { winnerUserId: "winner-1", kind: "kokushi13Wait" as const },
      { winnerUserId: "winner-2", kind: "junseiChuurenPoutou" as const },
    ];

    await leagueRef.set({ rule_locked: false });
    await sessionRef.set({ total_match_count: 0 });

    try {
      const created = await repository.create({
        leagueId,
        seasonId,
        sessionId,
        playedAt: "2026-01-01T00:00:00.000Z",
        results,
        yakumanEvents,
      });

      assert.deepEqual(
        created.yakumanEvents.map(({ winnerUserId, kind }) => ({
          winnerUserId,
          kind,
        })),
        yakumanEvents,
      );
      const matchRef = sessionRef.collection("matches").doc(created.id);
      assert.deepEqual(
        (await matchRef.get()).data()?.yakuman_events,
        yakumanEvents.map(({ winnerUserId, kind }) => ({
          winner_user_id: winnerUserId,
          kind,
        })),
      );

      const omittedUpdate = await repository.update({
        leagueId,
        seasonId,
        sessionId,
        matchId: created.id,
      });
      assert.deepEqual(
        omittedUpdate.yakumanEvents.map(({ winnerUserId, kind }) => ({
          winnerUserId,
          kind,
        })),
        yakumanEvents,
      );

      const clearedUpdate = await repository.update({
        leagueId,
        seasonId,
        sessionId,
        matchId: created.id,
        yakumanEvents: [],
      });
      assert.deepEqual(clearedUpdate.yakumanEvents, []);

      await matchRef.update({ yakuman_events: FieldValue.delete() });
      const legacyMatch = await repository.get(
        leagueId,
        seasonId,
        sessionId,
        created.id,
      );
      assert.deepEqual(legacyMatch.yakumanEvents, []);

      const createdWithoutEvents = await repository.create({
        leagueId,
        seasonId,
        sessionId,
        playedAt: "2026-01-01T00:01:00.000Z",
        results,
      });
      assert.deepEqual(createdWithoutEvents.yakumanEvents, []);
      assert.deepEqual(
        (
          await sessionRef
            .collection("matches")
            .doc(createdWithoutEvents.id)
            .get()
        ).data()?.yakuman_events,
        [],
      );
    } finally {
      await db.recursiveDelete(leagueRef);
    }
  },
);
