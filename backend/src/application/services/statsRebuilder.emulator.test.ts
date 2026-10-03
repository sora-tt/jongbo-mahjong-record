import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { deleteApp, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import test from "node:test";
import type { UserMatchStatisticsRepository } from "@/domain/statistics/repository.js";
import type { StatisticsScope } from "@/domain/statistics/types.js";
import type { UserStatsRepository } from "@/domain/user/repository.js";
import { MatchService } from "@/application/services/matchService.js";
import { StatsRebuilder } from "@/application/services/statsRebuilder.js";
import { asOpaqueId } from "@/domain/shared/types.js";
import { FirestoreLeagueRepository } from "@/infrastructure/firestore/repositories/leagueRepository.js";
import { FirestoreMatchRepository } from "@/infrastructure/firestore/repositories/matchRepository.js";
import { FirestoreSeasonRepository } from "@/infrastructure/firestore/repositories/seasonRepository.js";
import { FirestoreSessionRepository } from "@/infrastructure/firestore/repositories/sessionRepository.js";
import { FirestoreUserMatchStatisticsRepository } from "@/infrastructure/firestore/repositories/userMatchStatisticsRepository.js";
import { FirestoreUserRepository } from "@/infrastructure/firestore/repositories/userRepository.js";
import { FirestoreUserStatsRepository } from "@/infrastructure/firestore/repositories/userStatsRepository.js";

const emulatorAvailable = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

test(
  "full repair invalidates saved scopes, rebuilds every projection before publishing snapshots, and converges",
  { skip: !emulatorAvailable },
  async () => {
    const suffix = randomUUID();
    const projectId = `stats-${createHash("sha256").update(suffix).digest("hex").slice(0, 12)}`;
    const app = initializeApp({ projectId }, `stats-repair-${suffix}`);
    const db = getFirestore(app);
    const userRepository = new FirestoreUserRepository(db);
    const baseUserStatsRepository = new FirestoreUserStatsRepository(db);
    const baseProjectionRepository: UserMatchStatisticsRepository =
      new FirestoreUserMatchStatisticsRepository(db);
    const leagueRepository = new FirestoreLeagueRepository(db, userRepository);
    const seasonRepository = new FirestoreSeasonRepository(db);
    const sessionRepository = new FirestoreSessionRepository(db);
    const matchRepository = new FirestoreMatchRepository(db);
    const memberIds = Array.from(
      { length: 4 },
      (_, index) => `repair-${suffix}-${index + 1}`,
    );
    const members = memberIds.map((userId, index) => ({
      userId: asOpaqueId(userId),
      userName: `repair-user-${index + 1}`,
    }));
    let leagueId: string | null = null;
    let firstSeasonId: string | null = null;
    let secondSeasonId: string | null = null;
    let repairInProgress = false;
    let completedProjectionCount = 0;
    let invalidationVerified = false;

    const userStatsRepository: UserStatsRepository = {
      get: (params) => baseUserStatsRepository.get(params),
      getWithPersonalStatistics: (params) =>
        baseUserStatsRepository.getWithPersonalStatistics(params),
      upsert: async (key, data) => {
        if (repairInProgress && data.personalStatisticsVersion === 1) {
          assert.equal(
            completedProjectionCount,
            2,
            "snapshot publication must wait for all season projections",
          );
        }
        return baseUserStatsRepository.upsert(key, data);
      },
      markScopesUncomputed: (scopes) =>
        baseUserStatsRepository.markScopesUncomputed(scopes),
      deleteMissingScopeStats: (params) =>
        baseUserStatsRepository.deleteMissingScopeStats(params),
      deleteStatsForLeague: (targetLeagueId) =>
        baseUserStatsRepository.deleteStatsForLeague(targetLeagueId),
      deleteMissingSeasonStats: (targetLeagueId, targetSeasonId, keepUserIds) =>
        baseUserStatsRepository.deleteMissingSeasonStats(
          targetLeagueId,
          targetSeasonId,
          keepUserIds,
        ),
    };
    const projectionRepository: UserMatchStatisticsRepository = {
      replaceSeason: async (input) => {
        if (repairInProgress && !invalidationVerified) {
          assert.ok(leagueId && firstSeasonId && secondSeasonId);
          const scopes: StatisticsScope[] = [
            {
              scopeType: "season",
              leagueId: asOpaqueId(leagueId),
              seasonId: asOpaqueId(firstSeasonId),
            },
            {
              scopeType: "season",
              leagueId: asOpaqueId(leagueId),
              seasonId: asOpaqueId(secondSeasonId),
            },
            { scopeType: "league", leagueId: asOpaqueId(leagueId) },
            { scopeType: "overall" },
          ];
          for (const scope of scopes) {
            for (const userId of memberIds) {
              const stats =
                await baseUserStatsRepository.getWithPersonalStatistics({
                  userId,
                  ...scope,
                });
              assert.ok(
                stats === null || stats.personalStatisticsVersion === 0,
                `${scope.scopeType} scope must be uncomputed before projections are replaced`,
              );
            }
          }
          invalidationVerified = true;
        }
        await baseProjectionRepository.replaceSeason(input);
        if (repairInProgress) completedProjectionCount += 1;
      },
      deleteSeason: (targetLeagueId, targetSeasonId) =>
        baseProjectionRepository.deleteSeason(targetLeagueId, targetSeasonId),
      deleteLeague: (targetLeagueId) =>
        baseProjectionRepository.deleteLeague(targetLeagueId),
      listForScope: (query) => baseProjectionRepository.listForScope(query),
      listPage: (query) => baseProjectionRepository.listPage(query),
    };

    try {
      await Promise.all(
        members.map((member, index) =>
          userRepository.upsertProfile({
            userId: member.userId,
            email: null,
            name: member.userName,
            username: `stats-repair-${suffix}-${index + 1}`,
          }),
        ),
      );
      const league = await leagueRepository.create({
        name: `statistics repair ${suffix}`,
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
        memberUserIds: memberIds,
      });
      leagueId = league.id;
      const firstSeason = await seasonRepository.create(
        league.id,
        {
          name: "repair season with match",
          memberUserIds: memberIds,
          status: "active",
        },
        members,
      );
      firstSeasonId = firstSeason.id;
      const secondSeason = await seasonRepository.create(
        league.id,
        {
          name: "repair empty season",
          memberUserIds: memberIds,
          status: "archived",
        },
        members,
      );
      secondSeasonId = secondSeason.id;
      const session = await sessionRepository.create(
        league.id,
        firstSeason.id,
        {
          startedAt: "2026-01-01T00:00:00.000Z",
          memberUserIds: memberIds,
          createdBy: memberIds[0]!,
        },
        members,
      );

      const initialRebuilder = new StatsRebuilder(
        leagueRepository,
        seasonRepository,
        sessionRepository,
        matchRepository,
        baseUserStatsRepository,
        baseProjectionRepository,
      );
      const matchService = new MatchService(
        leagueRepository,
        seasonRepository,
        sessionRepository,
        matchRepository,
        initialRebuilder,
      );
      await matchService.createMatch(
        memberIds[0]!,
        league.id,
        firstSeason.id,
        session.id,
        {
          playedAt: "2026-01-01T00:01:00.000Z",
          results: members.map((member, index) => ({
            userId: member.userId,
            wind: (["east", "south", "west", "north"] as const)[index]!,
            rawScore: 40000 - index * 10000,
          })),
        },
      );

      repairInProgress = true;
      const fullRepair = new StatsRebuilder(
        leagueRepository,
        seasonRepository,
        sessionRepository,
        matchRepository,
        userStatsRepository,
        projectionRepository,
      );
      const report = await fullRepair.rebuildAll();
      assert.equal(report.scope.type, "all");
      assert.equal(report.matchCount, 1);
      assert.equal(completedProjectionCount, 2);
      assert.equal(invalidationVerified, true);

      const snapshotKeys = [
        ...memberIds.map((userId) => ({
          userId,
          scopeType: "season" as const,
          leagueId: league.id,
          seasonId: firstSeason.id,
        })),
        ...memberIds.map((userId) => ({
          userId,
          scopeType: "season" as const,
          leagueId: league.id,
          seasonId: secondSeason.id,
        })),
        ...memberIds.map((userId) => ({
          userId,
          scopeType: "league" as const,
          leagueId: league.id,
          seasonId: undefined,
        })),
        ...memberIds.map((userId) => ({
          userId,
          scopeType: "overall" as const,
          leagueId: undefined,
          seasonId: undefined,
        })),
      ];
      const snapshots = await Promise.all(
        snapshotKeys.map((key) =>
          baseUserStatsRepository.getWithPersonalStatistics(key),
        ),
      );
      assert.ok(
        snapshots.every((stats) => stats?.personalStatisticsVersion === 1),
      );
      assert.equal(
        snapshots[0]?.personalStatisticsSnapshot?.all.totals.totalMatchCount,
        1,
      );
      assert.equal(
        snapshots[4]?.personalStatisticsSnapshot?.all.totals.totalMatchCount,
        0,
      );
      assert.equal(
        (
          await baseProjectionRepository.listForScope({
            scopeType: "season",
            leagueId: league.id,
            seasonId: firstSeason.id,
            userId: memberIds[0]!,
          })
        ).length,
        1,
      );
      assert.deepEqual(
        await baseProjectionRepository.listForScope({
          scopeType: "season",
          leagueId: league.id,
          seasonId: secondSeason.id,
          userId: memberIds[0]!,
        }),
        [],
      );

      const firstSnapshots = structuredClone(
        snapshots.map((stats) => stats?.personalStatisticsSnapshot),
      );
      completedProjectionCount = 0;
      invalidationVerified = false;
      await fullRepair.rebuildAll();
      const snapshotsAfterRetry = await Promise.all(
        snapshotKeys.map((key) =>
          baseUserStatsRepository.getWithPersonalStatistics(key),
        ),
      );
      assert.deepEqual(
        snapshotsAfterRetry.map((stats) => stats?.personalStatisticsSnapshot),
        firstSnapshots,
      );
      assert.equal(completedProjectionCount, 2);
      assert.equal(
        (
          await baseProjectionRepository.listForScope({
            scopeType: "season",
            leagueId: league.id,
            seasonId: firstSeason.id,
            userId: memberIds[0]!,
          })
        ).length,
        1,
      );
    } finally {
      try {
        await baseUserStatsRepository.deleteMissingScopeStats({
          scopeType: "overall",
          leagueId: null,
          seasonId: null,
          keepUserIds: [],
        });
        if (leagueId) {
          await Promise.all([
            baseUserStatsRepository.deleteStatsForLeague(leagueId),
            baseProjectionRepository.deleteLeague(leagueId),
            db.recursiveDelete(db.collection("leagues").doc(leagueId)),
          ]);
        }
        await Promise.all(
          memberIds.map((userId) =>
            db.collection("users").doc(userId).delete(),
          ),
        );
      } finally {
        await db.terminate();
        await deleteApp(app);
      }
    }
  },
);
