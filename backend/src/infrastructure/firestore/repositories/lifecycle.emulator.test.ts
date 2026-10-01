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
import { MatchService } from "@/application/services/matchService.js";
import { asOpaqueId } from "@/domain/shared/types.js";

const emulatorAvailable = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

const makeFixedRule = () => ({
  gameType: "yonma" as const,
  uma: {
    mode: "fixed" as const,
    first: 20,
    second: 10,
    third: -10,
    fourth: -20,
  },
  oka: { startingPoints: 25000, returnPoints: 30000 },
  chomboPenaltyPoints: 0,
  allowOffTableKyotaku: false,
});

const floatingRule = {
  gameType: "yonma" as const,
  uma: {
    mode: "floatingCount" as const,
    pointsByFloatingCount: {
      0: { first: 0, second: 0, third: 0, fourth: 0 },
      1: { first: 12, second: -1, third: -3, fourth: -8 },
      2: { first: 8, second: 4, third: -4, fourth: -8 },
      3: { first: 8, second: 3, third: 1, fourth: -12 },
      4: { first: 0, second: 0, third: 0, fourth: 0 },
    },
  },
  oka: { startingPoints: 25000, returnPoints: 25000 },
  chomboPenaltyPoints: 0,
  allowOffTableKyotaku: false,
};

const makeLeagueRuleDoc = (uma: Record<string, unknown>) => ({
  game_type: "yonma",
  uma,
  oka: { starting_points: 25000, return_points: 25000 },
});

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
      uma: {
        mode: "fixed" as const,
        first: 20,
        second: 10,
        third: -10,
        fourth: -20,
      },
      oka: { startingPoints: 25000, returnPoints: 30000 },
      chomboPenaltyPoints: 0,
      allowOffTableKyotaku: false,
    };
    const league = await leagueRepository.create({
      name: "lifecycle test",
      rule: leagueRule,
      memberUserIds: ["0001"],
    });

    const leagueRef = db.collection("leagues").doc(league.id);
    const createdDocument = (await leagueRef.get()).data();
    assert.equal(createdDocument?.rule.uma.mode, "fixed");
    const storedRule = createdDocument?.rule;
    assert.ok(storedRule);
    const legacyUma = { ...storedRule.uma };
    delete legacyUma.mode;
    await leagueRef.update({ rule: { ...storedRule, uma: legacyUma } });
    assert.equal((await leagueRepository.getRule(league.id)).uma.mode, "fixed");
    assert.equal((await leagueRef.get()).data()?.rule.uma.mode, undefined);
    await leagueRef.update({ "rule.uma.mode": "unsupported" });
    await assert.rejects(
      leagueRepository.getRule(league.id),
      /unsupported Firestore league uma mode/,
    );
    await leagueRef.update({ "rule.uma.mode": "fixed" });

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
            chomboPenaltyPoints: 0,
            allowOffTableKyotaku: false,
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
  "keeps floating-count rule locked and preserves saved points and aggregates through match deletion",
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
    const matchService = new MatchService(
      leagueRepository,
      seasonRepository,
      sessionRepository,
      matchRepository,
      statsRebuilder,
    );
    const league = await leagueRepository.create({
      name: "floating count rule lock test",
      rule: floatingRule,
      memberUserIds: [],
    });
    const members = [
      { userId: asOpaqueId("0001"), userName: "岩田" },
      { userId: asOpaqueId("0002"), userName: "富田" },
      { userId: asOpaqueId("0003"), userName: "野口" },
      { userId: asOpaqueId("0004"), userName: "梶" },
    ];
    const season = await seasonRepository.create(
      league.id,
      {
        name: "rule lock season",
        memberUserIds: members.map(({ userId }) => userId),
        status: "active",
      },
      members,
    );
    const session = await sessionRepository.create(
      league.id,
      season.id,
      {
        startedAt: "2026-01-01T00:00:00.000Z",
        memberUserIds: members.map(({ userId }) => userId),
        createdBy: "0001",
      },
      members,
    );
    const leagueRef = db.collection("leagues").doc(league.id);

    try {
      assert.equal((await leagueRef.get()).data()?.rule_locked, false);

      const firstMatch = await matchService.createMatch(
        "0001",
        league.id,
        season.id,
        session.id,
        {
          playedAt: "2026-01-01T00:01:00.000Z",
          results: [
            { userId: "0001", wind: "east", rawScore: 40000 },
            { userId: "0002", wind: "south", rawScore: 30000 },
            { userId: "0003", wind: "west", rawScore: 20000 },
            { userId: "0004", wind: "north", rawScore: 10000 },
          ],
        },
      );

      assert.equal((await leagueRef.get()).data()?.rule_locked, true);
      assert.deepEqual(
        firstMatch.results.map(({ rank, point }) => ({ rank, point })),
        [
          { rank: 1, point: 23 },
          { rank: 2, point: 9 },
          { rank: 3, point: -9 },
          { rank: 4, point: -23 },
        ],
      );

      await assert.rejects(
        leagueRepository.update(league.id, {
          rule: makeFixedRule(),
        }),
        /league rule is locked after the first match/,
      );
      assert.deepEqual(
        (
          await matchRepository.get(
            league.id,
            season.id,
            session.id,
            firstMatch.id,
          )
        ).results,
        firstMatch.results,
      );

      const secondMatch = await matchService.createMatch(
        "0001",
        league.id,
        season.id,
        session.id,
        {
          playedAt: "2026-01-01T00:02:00.000Z",
          results: [
            { userId: "0001", wind: "east", rawScore: 39000 },
            { userId: "0002", wind: "south", rawScore: 28000 },
            { userId: "0003", wind: "west", rawScore: 26000 },
            { userId: "0004", wind: "north", rawScore: 7000 },
          ],
        },
      );
      const secondMatchResults = secondMatch.results;
      const expectedStandingsBeforeDelete = firstMatch.results
        .map((firstResult) => {
          const secondResult = secondMatchResults.find(
            ({ userId }) => userId === firstResult.userId,
          );
          assert.ok(secondResult);
          return {
            userId: firstResult.userId,
            totalPoints: firstResult.point + secondResult.point,
            matchCount: 2,
          };
        })
        .sort((left, right) => left.userId.localeCompare(right.userId));
      const seasonBeforeDelete = await seasonRepository.get(
        league.id,
        season.id,
      );
      assert.deepEqual(
        seasonBeforeDelete.standings
          .map(({ userId, totalPoints, matchCount }) => ({
            userId,
            totalPoints,
            matchCount,
          }))
          .sort((left, right) => left.userId.localeCompare(right.userId)),
        expectedStandingsBeforeDelete,
      );

      await matchService.deleteMatch(
        "0001",
        league.id,
        season.id,
        session.id,
        firstMatch.id,
      );

      assert.equal((await leagueRef.get()).data()?.rule_locked, true);
      await assert.rejects(
        leagueRepository.update(league.id, {
          rule: makeFixedRule(),
        }),
        /league rule is locked after the first match/,
      );
      assert.deepEqual(
        (
          await matchRepository.get(
            league.id,
            season.id,
            session.id,
            secondMatch.id,
          )
        ).results,
        secondMatchResults,
      );
      assert.equal(
        (await sessionRepository.get(league.id, season.id, session.id))
          .totalMatchCount,
        1,
      );

      const seasonAfterDelete = await seasonRepository.get(
        league.id,
        season.id,
      );
      assert.deepEqual(
        seasonAfterDelete.standings
          .map(({ userId, totalPoints, matchCount }) => ({
            userId,
            totalPoints,
            matchCount,
          }))
          .sort((left, right) => left.userId.localeCompare(right.userId)),
        secondMatchResults
          .map(({ userId, point }) => ({
            userId,
            totalPoints: point,
            matchCount: 1,
          }))
          .sort((left, right) => left.userId.localeCompare(right.userId)),
      );
      for (const result of secondMatchResults) {
        const stats = await userStatsRepository.get({
          userId: result.userId,
          scopeType: "season",
          leagueId: league.id,
          seasonId: season.id,
        });
        assert.equal(stats?.totalPoints, result.point);
        assert.equal(stats?.totalMatchCount, 1);
      }

      await matchService.deleteMatch(
        "0001",
        league.id,
        season.id,
        session.id,
        secondMatch.id,
      );
      assert.equal((await leagueRef.get()).data()?.rule_locked, true);
      assert.equal(
        (await sessionRepository.get(league.id, season.id, session.id))
          .totalMatchCount,
        0,
      );
      await assert.rejects(
        leagueRepository.update(league.id, {
          rule: makeFixedRule(),
        }),
        /league rule is locked after the first match/,
      );
    } finally {
      await db.recursiveDelete(leagueRef);
      await userStatsRepository.deleteStatsForLeague(league.id);
    }
  },
);

test(
  "uses a legacy fixed Firestore rule to save Match points and season standings",
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
    const matchService = new MatchService(
      leagueRepository,
      seasonRepository,
      sessionRepository,
      matchRepository,
      statsRebuilder,
    );
    const league = await leagueRepository.create({
      name: "legacy fixed scoring test",
      rule: makeFixedRule(),
      memberUserIds: ["0001"],
    });
    const leagueRef = db.collection("leagues").doc(league.id);
    const members = [
      { userId: asOpaqueId("0001"), userName: "岩田" },
      { userId: asOpaqueId("0002"), userName: "富田" },
      { userId: asOpaqueId("0003"), userName: "野口" },
      { userId: asOpaqueId("0004"), userName: "梶" },
    ];
    const season = await seasonRepository.create(
      league.id,
      {
        name: "legacy fixed season",
        memberUserIds: members.map(({ userId }) => userId),
        status: "active",
      },
      members,
    );
    const session = await sessionRepository.create(
      league.id,
      season.id,
      {
        startedAt: "2026-01-01T00:00:00.000Z",
        memberUserIds: members.map(({ userId }) => userId),
        createdBy: "0001",
      },
      members,
    );

    try {
      const storedRule = (await leagueRef.get()).data()?.rule;
      assert.ok(storedRule);
      const legacyUma = { ...storedRule.uma };
      delete legacyUma.mode;
      await leagueRef.update({ rule: { ...storedRule, uma: legacyUma } });

      const hydratedRule = await leagueRepository.getRule(league.id);
      assert.equal(hydratedRule.uma.mode, "fixed");
      assert.equal((await leagueRef.get()).data()?.rule.uma.mode, undefined);

      const createdMatch = await matchService.createMatch(
        "0001",
        league.id,
        season.id,
        session.id,
        {
          playedAt: "2026-01-01T00:01:00.000Z",
          results: [
            { userId: "0001", wind: "east", rawScore: 40000 },
            { userId: "0002", wind: "south", rawScore: 30000 },
            { userId: "0003", wind: "west", rawScore: 20000 },
            { userId: "0004", wind: "north", rawScore: 10000 },
          ],
        },
      );
      const savedMatch = await matchRepository.get(
        league.id,
        season.id,
        session.id,
        createdMatch.id,
      );
      const savedPoints = savedMatch.results
        .map(({ userId, rank, point }) => ({ userId, rank, point }))
        .sort((left, right) => left.userId.localeCompare(right.userId));

      assert.deepEqual(
        savedPoints,
        members
          .map(({ userId }, index) => ({
            userId,
            rank: index + 1,
            point: [50, 10, -20, -40][index],
          }))
          .sort((left, right) => left.userId.localeCompare(right.userId)),
      );
      assert.deepEqual(
        (await seasonRepository.get(league.id, season.id)).standings
          .map(({ userId, totalPoints, matchCount }) => ({
            userId,
            totalPoints,
            matchCount,
          }))
          .sort((left, right) => left.userId.localeCompare(right.userId)),
        members
          .map(({ userId }, index) => ({
            userId,
            totalPoints: [50, 10, -20, -40][index],
            matchCount: 1,
          }))
          .sort((left, right) => left.userId.localeCompare(right.userId)),
      );
    } finally {
      await db.recursiveDelete(leagueRef);
      await userStatsRepository.deleteStatsForLeague(league.id);
    }
  },
);

test(
  "round trips floating-count uma with every row persisted",
  { skip: !emulatorAvailable },
  async () => {
    const db = getDb();
    const userRepository = new FirestoreUserRepository(db);
    const leagueRepository = new FirestoreLeagueRepository(db, userRepository);
    const league = await leagueRepository.create({
      name: "floating count persistence test",
      rule: makeFixedRule(),
      memberUserIds: [],
    });
    const leagueRef = db.collection("leagues").doc(league.id);

    try {
      const updatedLeague = await leagueRepository.update(league.id, {
        rule: floatingRule,
      });
      const storedRule = (await leagueRef.get()).data()?.rule;

      assert.equal(storedRule?.uma.mode, "floating_count");
      assert.deepEqual(storedRule?.uma.points_by_floating_count, {
        "0": { first: 0, second: 0, third: 0, fourth: 0 },
        "1": { first: 12, second: -1, third: -3, fourth: -8 },
        "2": { first: 8, second: 4, third: -4, fourth: -8 },
        "3": { first: 8, second: 3, third: 1, fourth: -12 },
        "4": { first: 0, second: 0, third: 0, fourth: 0 },
      });
      assert.deepEqual(updatedLeague.rule, floatingRule);
      assert.deepEqual(await leagueRepository.getRule(league.id), floatingRule);
    } finally {
      await db.recursiveDelete(leagueRef);
    }
  },
);

test(
  "rejects invalid stored floating-count uma shapes",
  { skip: !emulatorAvailable },
  async () => {
    const db = getDb();
    const userRepository = new FirestoreUserRepository(db);
    const leagueRepository = new FirestoreLeagueRepository(db, userRepository);
    const league = await leagueRepository.create({
      name: "invalid floating count persistence test",
      rule: makeFixedRule(),
      memberUserIds: [],
    });
    const leagueRef = db.collection("leagues").doc(league.id);
    const validRows = {
      "0": { first: 0, second: 0, third: 0, fourth: 0 },
      "1": { first: 12, second: -1, third: -3, fourth: -8 },
      "2": { first: 8, second: 4, third: -4, fourth: -8 },
      "3": { first: 8, second: 3, third: 1, fourth: -12 },
      "4": { first: 0, second: 0, third: 0, fourth: 0 },
    };

    try {
      await leagueRef.update({
        rule: makeLeagueRuleDoc({ mode: "unknown" }),
      });
      await assert.rejects(
        leagueRepository.getRule(league.id),
        /unsupported Firestore league uma mode: unknown/,
      );

      const missingCountRows: Record<string, unknown> = { ...validRows };
      delete missingCountRows["3"];
      await leagueRef.update({
        rule: makeLeagueRuleDoc({
          mode: "floating_count",
          points_by_floating_count: missingCountRows,
        }),
      });
      await assert.rejects(
        leagueRepository.getRule(league.id),
        /invalid or missing Firestore field: leagues.rule.uma.points_by_floating_count.3/,
      );

      await leagueRef.update({
        rule: makeLeagueRuleDoc({
          mode: "floating_count",
          points_by_floating_count: {
            ...validRows,
            "2": { ...validRows["2"], third: "not-a-number" },
          },
        }),
      });
      await assert.rejects(
        leagueRepository.getRule(league.id),
        /invalid or missing Firestore field: leagues.rule.uma.points_by_floating_count.2.third/,
      );
    } finally {
      await db.recursiveDelete(leagueRef);
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
        uma: {
          mode: "fixed",
          first: 20,
          second: 10,
          third: -10,
          fourth: -20,
        },
        oka: { startingPoints: 25000, returnPoints: 30000 },
        chomboPenaltyPoints: 0,
        allowOffTableKyotaku: false,
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
