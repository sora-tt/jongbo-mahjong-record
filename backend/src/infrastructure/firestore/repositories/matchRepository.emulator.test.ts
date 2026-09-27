import assert from "node:assert/strict";
import test from "node:test";
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
