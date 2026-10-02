import assert from "node:assert/strict";
import test from "node:test";
import { FieldValue } from "firebase-admin/firestore";
import { asOpaqueId } from "@/domain/shared/types.js";
import type {
  PersonalStatisticsSnapshot,
  PersonalStatisticsSnapshotValues,
  FormatSummary,
} from "@/domain/statistics/types.js";
import type { UserStats } from "@/domain/user/types.js";
import { buildUserStatsId } from "@/domain/user/statsKey.js";
import { getDb } from "@/infrastructure/firestore/client.js";
import { FirestoreUserStatsRepository } from "@/infrastructure/firestore/repositories/userStatsRepository.js";

const emulatorAvailable = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

const makeKey = (suffix: string) => ({
  userId: `snapshot-repository-test-user-${suffix}`,
  scopeType: "season" as const,
  leagueId: `snapshot-repository-test-league-${suffix}`,
  seasonId: `snapshot-repository-test-season-${suffix}`,
});

const makeStats = (
  key: ReturnType<typeof makeKey>,
): Omit<UserStats, "id" | "createdAt" | "updatedAt"> => ({
  userId: asOpaqueId(key.userId),
  userName: "snapshot test",
  scopeType: key.scopeType,
  leagueId: asOpaqueId(key.leagueId),
  seasonId: asOpaqueId(key.seasonId),
  leagueName: "snapshot league",
  seasonName: "snapshot season",
  totalPoints: 0,
  totalMatchCount: 0,
  chomboCount: 0,
  averageRank: 0,
  currentRank: null,
  firstCount: 0,
  secondCount: 0,
  thirdCount: 0,
  fourthCount: 0,
  firstRate: 0,
  secondRate: 0,
  thirdRate: 0,
  fourthRate: 0,
  highestScore: null,
  lowestScore: null,
  averageScore: null,
  winStreak: null,
  loseStreak: null,
});

const makeFormatSummary = (gameType: "sanma" | "yonma"): FormatSummary => ({
  gameType,
  matchCount: 0,
  totalPoints: 0,
  averageFinalPoint: null,
  averageRank: null,
  ranks: [],
  topRate: null,
  topTwoRate: null,
  topThreeRate: null,
  lastRate: null,
  lastAvoidanceRate: null,
});

const makeSnapshotValues = (): PersonalStatisticsSnapshotValues => ({
  totals: {
    totalMatchCount: 0,
    sessionCount: 0,
    totalPoints: 0,
    averageFinalPoint: null,
    chomboCount: 0,
  },
  byGameType: [makeFormatSummary("sanma"), makeFormatSummary("yonma")],
  rawScore: {
    matchCount: 0,
    average: null,
    maximum: null,
    minimum: null,
    median: null,
    populationStandardDeviation: null,
  },
  finalPoint: {
    matchCount: 0,
    average: null,
    maximum: null,
    minimum: null,
    median: null,
    populationStandardDeviation: null,
    positive: { count: 0, denominator: 0, rate: null },
    negative: { count: 0, denominator: 0, rate: null },
    even: { count: 0, denominator: 0, rate: null },
  },
  scoreByRank: [],
  records: {
    highestRawScore: null,
    lowestRawScore: null,
    highestFinalPoint: null,
    lowestFinalPoint: null,
  },
  streaks: [],
  recentResults: [],
  currentStanding: null,
});

const makeSnapshot = (): PersonalStatisticsSnapshot => ({
  all: makeSnapshotValues(),
  byGameType: [
    { gameType: "sanma", summary: makeFormatSnapshotValues() },
    { gameType: "yonma", summary: makeFormatSnapshotValues() },
  ],
});

const makeFormatSnapshotValues = (): Omit<
  PersonalStatisticsSnapshotValues,
  "byGameType"
> => {
  const values = makeSnapshotValues();
  return {
    totals: values.totals,
    rawScore: values.rawScore,
    finalPoint: values.finalPoint,
    scoreByRank: values.scoreByRank,
    records: values.records,
    streaks: values.streaks,
    recentResults: values.recentResults,
    currentStanding: values.currentStanding,
  };
};

const makeRef = (
  db: ReturnType<typeof getDb>,
  key: ReturnType<typeof makeKey>,
) =>
  db.collection("user_stats").doc(
    buildUserStatsId({
      ...key,
      userId: asOpaqueId(key.userId),
      leagueId: asOpaqueId(key.leagueId),
      seasonId: asOpaqueId(key.seasonId),
    }),
  );

test(
  "writes readiness version and bounded snapshot fields with the existing stats document",
  { skip: !emulatorAvailable },
  async () => {
    const db = getDb();
    const repository = new FirestoreUserStatsRepository(db);
    const key = makeKey("legacy");
    const ref = makeRef(db, key);

    await ref.delete();
    try {
      await repository.upsert(key, makeStats(key));

      const stored = (await ref.get()).data();
      assert.equal(stored?.personal_statistics_version, 0);
      assert.equal(stored?.personal_statistics, null);

      await ref.update({
        personal_statistics_version: FieldValue.delete(),
        personal_statistics: FieldValue.delete(),
      });
      const uncomputed = await repository.getWithPersonalStatistics(key);
      assert.equal(uncomputed?.personalStatisticsVersion, 0);
      assert.equal(uncomputed?.personalStatisticsSnapshot, null);

      const legacyStats = await repository.get(key);
      assert.ok(legacyStats);
      assert.equal(
        Object.hasOwn(legacyStats, "personalStatisticsVersion"),
        false,
      );
    } finally {
      await ref.delete();
    }
  },
);

test(
  "round-trips a bounded whole, sanma, and yonma snapshot with its ready version",
  { skip: !emulatorAvailable },
  async () => {
    const db = getDb();
    const repository = new FirestoreUserStatsRepository(db);
    const key = makeKey("ready");
    const ref = makeRef(db, key);
    const snapshot = makeSnapshot();

    await ref.delete();
    try {
      await repository.upsert(key, {
        ...makeStats(key),
        personalStatisticsVersion: 1,
        personalStatisticsSnapshot: snapshot,
      });

      const stored = (await ref.get()).data();
      assert.equal(stored?.personal_statistics_version, 1);
      assert.deepEqual(stored?.personal_statistics, snapshot);

      const result = await repository.getWithPersonalStatistics(key);
      assert.equal(result?.personalStatisticsVersion, 1);
      assert.deepEqual(result?.personalStatisticsSnapshot, snapshot);
      assert.equal(result?.stats.totalMatchCount, 0);

      await ref.update({
        personal_statistics: { all: null, byGameType: [] },
      });
      await assert.rejects(
        repository.getWithPersonalStatistics(key),
        /expected object, received null/,
      );

      const missingYonmaSlice: PersonalStatisticsSnapshot = {
        ...snapshot,
        all: {
          ...snapshot.all,
          byGameType: [snapshot.all.byGameType[0]!],
        },
        byGameType: [snapshot.byGameType[0]!],
      };
      await assert.rejects(
        repository.upsert(key, {
          ...makeStats(key),
          personalStatisticsVersion: 1,
          personalStatisticsSnapshot: missingYonmaSlice,
        }),
        /must contain both sanma and yonma summaries/,
      );

      const oversizedSnapshot: PersonalStatisticsSnapshot = {
        ...snapshot,
        byGameType: [...snapshot.byGameType, snapshot.byGameType[0]!],
      };
      await assert.rejects(
        repository.upsert(key, {
          ...makeStats(key),
          personalStatisticsVersion: 1,
          personalStatisticsSnapshot: oversizedSnapshot,
        }),
        /expected array to have <=2 items/,
      );

      const oversizedOverallFormats: PersonalStatisticsSnapshot = {
        ...snapshot,
        all: {
          ...snapshot.all,
          byGameType: [...snapshot.all.byGameType, snapshot.all.byGameType[0]!],
        },
      };
      await assert.rejects(
        repository.upsert(key, {
          ...makeStats(key),
          personalStatisticsVersion: 1,
          personalStatisticsSnapshot: oversizedOverallFormats,
        }),
        /expected array to have <=2 items/,
      );

      await assert.rejects(
        repository.upsert(key, {
          ...makeStats(key),
          personalStatisticsVersion: 1,
          personalStatisticsSnapshot: null,
        }),
        /ready personal statistics version requires a snapshot/,
      );
    } finally {
      await ref.delete();
    }
  },
);

test(
  "keeps legacy stats readable when the expanded snapshot is malformed",
  { skip: !emulatorAvailable },
  async () => {
    const db = getDb();
    const repository = new FirestoreUserStatsRepository(db);
    const key = makeKey("malformed-snapshot");
    const ref = makeRef(db, key);

    await ref.delete();
    try {
      await repository.upsert(key, makeStats(key));
      await ref.update({
        personal_statistics: { all: null, byGameType: [] },
      });

      const legacyStats = await repository.get(key);
      assert.ok(legacyStats);
      assert.equal(legacyStats.totalMatchCount, 0);

      await assert.rejects(
        repository.getWithPersonalStatistics(key),
        /expected object, received null/,
      );
    } finally {
      await ref.delete();
    }
  },
);
