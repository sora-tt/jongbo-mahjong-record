import assert from "node:assert/strict";
import test from "node:test";
import { getDb } from "@/infrastructure/firestore/client.js";
import { FirestoreLeagueRepository } from "@/infrastructure/firestore/repositories/leagueRepository.js";
import { FirestoreSeasonRepository } from "@/infrastructure/firestore/repositories/seasonRepository.js";
import { FirestoreUserRepository } from "@/infrastructure/firestore/repositories/userRepository.js";
import { asOpaqueId } from "@/domain/shared/types.js";

const emulatorAvailable = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

test(
  "serializes rule lock and active season lifecycle transitions",
  { skip: !emulatorAvailable },
  async () => {
    const db = getDb();
    const userRepository = new FirestoreUserRepository(db);
    const leagueRepository = new FirestoreLeagueRepository(db, userRepository);
    const seasonRepository = new FirestoreSeasonRepository(db);
    const leagueRule = {
      gameType: "yonma" as const,
      uma: { first: 20, second: 10, third: -10, fourth: -20 },
      oka: { startingPoints: 25000, returnPoints: 30000 },
    };
    const league = await leagueRepository.create({
      name: "lifecycle test",
      rule: leagueRule,
      memberUserIds: ["0001"],
    });
    const members = [{ userId: asOpaqueId("0001"), userName: "岩田" }];

    try {
      const activeSeason = await seasonRepository.create(
        league.id,
        { name: "active season", memberUserIds: ["0001"], status: "active" },
        members,
      );
      assert.equal(
        (await db.collection("leagues").doc(league.id).get()).data()
          ?.active_season_id,
        activeSeason.id,
      );

      await assert.rejects(
        seasonRepository.create(
          league.id,
          {
            name: "duplicate active",
            memberUserIds: ["0001"],
            status: "active",
          },
          members,
        ),
        /active season already exists/,
      );

      await seasonRepository.update(league.id, activeSeason.id, {
        status: "archived",
      });
      assert.equal(
        (await db.collection("leagues").doc(league.id).get()).data()
          ?.active_season_id,
        null,
      );

      const archivedSeason = await seasonRepository.create(
        league.id,
        {
          name: "archived season",
          memberUserIds: ["0001"],
          status: "archived",
        },
        members,
      );
      await seasonRepository.update(league.id, archivedSeason.id, {
        status: "active",
      });
      assert.equal(
        (await db.collection("leagues").doc(league.id).get()).data()
          ?.active_season_id,
        archivedSeason.id,
      );

      await db.collection("leagues").doc(league.id).update({
        rule_locked: true,
      });
      await assert.rejects(
        leagueRepository.update(league.id, {
          rule: {
            ...leagueRule,
            oka: { startingPoints: 30000, returnPoints: 30000 },
          },
        }),
        /league rule is locked after the first match/,
      );
    } finally {
      await db.recursiveDelete(db.collection("leagues").doc(league.id));
    }
  },
);
