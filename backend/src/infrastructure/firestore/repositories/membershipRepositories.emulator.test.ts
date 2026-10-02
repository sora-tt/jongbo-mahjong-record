import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { getDb } from "@/infrastructure/firestore/client.js";
import { FirestoreLeagueRepository } from "@/infrastructure/firestore/repositories/leagueRepository.js";
import { FirestoreSeasonRepository } from "@/infrastructure/firestore/repositories/seasonRepository.js";

const emulatorAvailable = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

test(
  "league membership lookup checks only the requested users in the requested league",
  { skip: !emulatorAvailable },
  async () => {
    const db = getDb();
    const leagueId = `membership-test-league-${randomUUID()}`;
    const otherLeagueId = `membership-test-league-${randomUUID()}`;
    const viewerUserId = `membership-test-viewer-${randomUUID()}`;
    const targetUserId = `membership-test-target-${randomUUID()}`;
    const unrelatedUserId = `membership-test-unrelated-${randomUUID()}`;
    const leagueRef = db.collection("leagues").doc(leagueId);
    const otherLeagueRef = db.collection("leagues").doc(otherLeagueId);
    const repository = new FirestoreLeagueRepository(db, {} as never);

    await Promise.all([
      leagueRef.set({ name: "membership lookup test" }),
      otherLeagueRef.set({ name: "other membership lookup test" }),
    ]);
    await Promise.all([
      leagueRef.collection("members").add({ user_id: viewerUserId }),
      leagueRef.collection("members").add({ user_id: targetUserId }),
      leagueRef.collection("members").add({ user_id: unrelatedUserId }),
      otherLeagueRef.collection("members").add({ user_id: targetUserId }),
    ]);

    try {
      assert.equal(
        await repository.areMembers(leagueId, viewerUserId, targetUserId),
        true,
      );
      assert.equal(
        await repository.areMembers(leagueId, viewerUserId, "absent-user"),
        false,
      );
      assert.equal(
        await repository.areMembers(leagueId, viewerUserId, ""),
        false,
      );
    } finally {
      await Promise.all([
        db.recursiveDelete(leagueRef),
        db.recursiveDelete(otherLeagueRef),
      ]);
    }
  },
);

test(
  "season membership lookup checks only the requested users in the requested season",
  { skip: !emulatorAvailable },
  async () => {
    const db = getDb();
    const leagueId = `membership-test-league-${randomUUID()}`;
    const seasonId = `membership-test-season-${randomUUID()}`;
    const otherSeasonId = `membership-test-season-${randomUUID()}`;
    const viewerUserId = `membership-test-viewer-${randomUUID()}`;
    const targetUserId = `membership-test-target-${randomUUID()}`;
    const unrelatedUserId = `membership-test-unrelated-${randomUUID()}`;
    const leagueRef = db.collection("leagues").doc(leagueId);
    const seasonRef = leagueRef.collection("seasons").doc(seasonId);
    const otherSeasonRef = leagueRef.collection("seasons").doc(otherSeasonId);
    const repository = new FirestoreSeasonRepository(db);

    await Promise.all([
      seasonRef.set({
        members: [
          { user_id: viewerUserId, user_name: "Viewer" },
          { user_id: targetUserId, user_name: "Target" },
          { user_id: unrelatedUserId, user_name: "Other" },
        ],
      }),
      otherSeasonRef.set({
        members: [{ user_id: viewerUserId, user_name: "Viewer" }],
      }),
    ]);

    try {
      assert.equal(
        await repository.areMembers(
          leagueId,
          seasonId,
          viewerUserId,
          targetUserId,
        ),
        true,
      );
      assert.equal(
        await repository.areMembers(
          leagueId,
          seasonId,
          viewerUserId,
          "absent-user",
        ),
        false,
      );
      assert.equal(
        await repository.areMembers(
          leagueId,
          otherSeasonId,
          viewerUserId,
          targetUserId,
        ),
        false,
      );
    } finally {
      await db.recursiveDelete(leagueRef);
    }
  },
);
