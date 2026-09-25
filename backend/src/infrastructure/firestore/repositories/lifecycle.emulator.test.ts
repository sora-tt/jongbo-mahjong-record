import assert from "node:assert/strict";
import test from "node:test";
import { getDb } from "@/infrastructure/firestore/client.js";
import { FirestoreLeagueRepository } from "@/infrastructure/firestore/repositories/leagueRepository.js";
import { FirestoreSeasonRepository } from "@/infrastructure/firestore/repositories/seasonRepository.js";
import { FirestoreMatchRepository } from "@/infrastructure/firestore/repositories/matchRepository.js";
import { FirestoreSessionRepository } from "@/infrastructure/firestore/repositories/sessionRepository.js";
import { FirestoreUserStatsRepository } from "@/infrastructure/firestore/repositories/userStatsRepository.js";
import { FirestoreUserRepository } from "@/infrastructure/firestore/repositories/userRepository.js";
import { StatsRebuilder } from "@/application/services/statsRebuilder.js";
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
        name: "renamed active season",
      });
      const renamedLeague = await db.collection("leagues").doc(league.id).get();
      assert.equal(
        renamedLeague.data()?.active_season_name,
        "renamed active season",
      );
      assert.equal(
        (await seasonRepository.get(league.id, activeSeason.id)).name,
        "renamed active season",
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

test(
  "rebuilds parent projections and clears season stats after scope deletion",
  { skip: !emulatorAvailable },
  async () => {
    const db = getDb();
    const userRepository = new FirestoreUserRepository(db);
    const leagueRepository = new FirestoreLeagueRepository(db, userRepository);
    const seasonRepository = new FirestoreSeasonRepository(db);
    const sessionRepository = new FirestoreSessionRepository(db);
    const matchRepository = new FirestoreMatchRepository(db);
    const userStatsRepository = new FirestoreUserStatsRepository(db);
    const statsRebuilder = new StatsRebuilder(
      leagueRepository,
      seasonRepository,
      sessionRepository,
      matchRepository,
      userStatsRepository,
    );
    const league = await leagueRepository.create({
      name: "delete lifecycle test",
      rule: {
        gameType: "yonma",
        uma: { first: 20, second: 10, third: -10, fourth: -20 },
        oka: { startingPoints: 25000, returnPoints: 30000 },
      },
      memberUserIds: ["0001"],
    });
    const members = [{ userId: asOpaqueId("0001"), userName: "岩田" }];
    const season = await seasonRepository.create(
      league.id,
      { name: "delete season", memberUserIds: ["0001"], status: "active" },
      members,
    );
    const session = await sessionRepository.create(
      league.id,
      season.id,
      {
        startedAt: "2026-01-01T00:00:00.000Z",
        memberUserIds: ["0001", "0002", "0003", "0004"],
        createdBy: "0001",
      },
      [
        { userId: asOpaqueId("0001"), userName: "岩田" },
        { userId: asOpaqueId("0002"), userName: "富田" },
        { userId: asOpaqueId("0003"), userName: "野口" },
        { userId: asOpaqueId("0004"), userName: "梶" },
      ],
    );

    try {
      await matchRepository.create({
        leagueId: league.id,
        seasonId: season.id,
        sessionId: session.id,
        playedAt: "2026-01-01T00:01:00.000Z",
        results: [
          {
            userId: asOpaqueId("0001"),
            userName: "岩田",
            wind: "east",
            rank: 1,
            rawScore: 35000,
            point: 45,
          },
          {
            userId: asOpaqueId("0002"),
            userName: "富田",
            wind: "south",
            rank: 2,
            rawScore: 25000,
            point: 5,
          },
          {
            userId: asOpaqueId("0003"),
            userName: "野口",
            wind: "west",
            rank: 3,
            rawScore: 20000,
            point: -25,
          },
          {
            userId: asOpaqueId("0004"),
            userName: "梶",
            wind: "north",
            rank: 3,
            rawScore: 20000,
            point: -25,
          },
        ],
      });
      await statsRebuilder.rebuildSeason(league.id, season.id);
      assert.ok(
        await userStatsRepository.get({
          userId: "0001",
          scopeType: "season",
          leagueId: league.id,
          seasonId: season.id,
        }),
      );

      await sessionRepository.delete(league.id, season.id, session.id);
      await statsRebuilder.rebuildSeason(league.id, season.id);
      assert.equal(
        (await seasonRepository.get(league.id, season.id)).totalMatchCount,
        0,
      );

      await seasonRepository.delete(league.id, season.id);
      await statsRebuilder.clearSeasonStats(league.id, season.id);
      await statsRebuilder.rebuildLeague(league.id);
      assert.equal(
        await userStatsRepository.get({
          userId: "0001",
          scopeType: "season",
          leagueId: league.id,
          seasonId: season.id,
        }),
        null,
      );

      await leagueRepository.delete(league.id);
      await statsRebuilder.clearLeagueStats(league.id);
      await statsRebuilder.rebuildOverall();
    } finally {
      await db.recursiveDelete(db.collection("leagues").doc(league.id));
      await userStatsRepository.deleteStatsForLeague(league.id);
    }
  },
);
