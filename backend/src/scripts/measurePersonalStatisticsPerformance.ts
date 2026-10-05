import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { deleteApp } from "firebase-admin/app";
import { Timestamp } from "firebase-admin/firestore";
import { Hono } from "hono";
import type { AppBindings } from "@/presentation/bindings.js";
import { buildPersonalStatisticsSnapshot } from "@/domain/statistics/snapshot-builder.js";
import type { UserMatchStatistics } from "@/domain/statistics/types.js";
import type { LeagueRepository } from "@/domain/league/repository.js";
import type { SeasonRepository } from "@/domain/season/repository.js";
import type { UserStatsUpsertData } from "@/domain/user/types.js";
import type { MatchRepository } from "@/domain/match/repository.js";
import type { StatsRebuilder } from "@/application/services/statsRebuilder.js";
import { LeagueService } from "@/application/services/leagueService.js";
import { SeasonService } from "@/application/services/seasonService.js";
import { buildUserStatsId } from "@/domain/user/statsKey.js";
import { getFirebaseAdminApp } from "@/infrastructure/firebase/app.js";
import { getDb } from "@/infrastructure/firestore/client.js";
import { FirestoreLeagueRepository } from "@/infrastructure/firestore/repositories/leagueRepository.js";
import { FirestoreSeasonRepository } from "@/infrastructure/firestore/repositories/seasonRepository.js";
import { FirestoreUserMatchStatisticsRepository } from "@/infrastructure/firestore/repositories/userMatchStatisticsRepository.js";
import { FirestoreUserRepository } from "@/infrastructure/firestore/repositories/userRepository.js";
import { FirestoreUserStatsRepository } from "@/infrastructure/firestore/repositories/userStatsRepository.js";
import {
  createStatisticsServices,
  type Services,
} from "@/presentation/dependencies.js";
import { buildLeaguesRouter } from "@/presentation/routes/leagues.js";
import { buildSeasonsRouter } from "@/presentation/routes/seasons.js";
import { buildUsersRouter } from "@/presentation/routes/users.js";
import { asIsoDateString, asOpaqueId } from "@/domain/shared/types.js";

const MATCH_COUNT = 200;
const WARMUP_COUNT = 5;
const SAMPLE_COUNT = 50;

type Counter = { reads: number };

const percentile95 = (values: readonly number[]) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.ceil(sorted.length * 0.95) - 1] ?? 0;
};

const makeMatchRows = (input: {
  targetUserId: string;
  leagueId: string;
  seasonId: string;
  memberIds: readonly string[];
}): UserMatchStatistics[] =>
  Array.from({ length: MATCH_COUNT }, (_, index) => {
    const rank = (index % 4) + 1;
    const playedAt = new Date(Date.UTC(2026, 8, 1 + Math.floor(index / 4)));
    const sessionIndex = Math.floor(index / 20);
    const opponentIds = input.memberIds.filter(
      (memberId) => memberId !== input.targetUserId,
    );

    return {
      id: asOpaqueId(`perf-projection-${input.targetUserId}-${index}`),
      userId: asOpaqueId(input.targetUserId),
      userName: "測定対象者",
      leagueId: asOpaqueId(input.leagueId),
      leagueName: "性能測定リーグ",
      seasonId: asOpaqueId(input.seasonId),
      seasonName: "性能測定シーズン",
      sessionId: asOpaqueId(`perf-session-${sessionIndex}`),
      sessionLabel: `測定卓 ${sessionIndex + 1}`,
      matchId: asOpaqueId(`perf-match-${input.targetUserId}-${index}`),
      matchIndex: (index % 20) + 1,
      playedAt: asIsoDateString(playedAt.toISOString()),
      gameType: "yonma",
      playerCount: 4,
      wind: "east",
      rank,
      rawScore: 40_000 - rank * 1_000 + (index % 5) * 100,
      finalPoint: [30, 10, -10, -30][rank - 1] ?? 0,
      chomboCount: index % 47 === 0 ? 1 : 0,
      opponents: opponentIds.map((userId, opponentIndex) => ({
        userId: asOpaqueId(userId),
        userName: `参加者 ${opponentIndex + 1}`,
        rank: ((rank + opponentIndex) % 4) + 1,
        finalPoint: 0,
      })),
      updatedAt: asIsoDateString(playedAt.toISOString()),
    };
  });

const toStatsData = (input: {
  userId: string;
  scopeType: "overall" | "league";
  leagueId: string | null;
  matches: readonly UserMatchStatistics[];
}): UserStatsUpsertData => {
  const rankCounts = [1, 2, 3, 4].map(
    (rank) => input.matches.filter((match) => match.rank === rank).length,
  );
  const totalPoints = Number(
    input.matches.reduce((sum, match) => sum + match.finalPoint, 0).toFixed(1),
  );
  const basicStats = {
    totalPoints,
    totalMatchCount: input.matches.length,
    chomboCount: input.matches.reduce(
      (sum, match) => sum + match.chomboCount,
      0,
    ),
    currentRank: null,
    firstCount: rankCounts[0] ?? 0,
    secondCount: rankCounts[1] ?? 0,
    thirdCount: rankCounts[2] ?? 0,
    fourthCount: rankCounts[3] ?? 0,
  };
  const snapshot = buildPersonalStatisticsSnapshot({
    targetUserId: asOpaqueId(input.userId),
    scopeType: input.scopeType,
    matches: input.matches,
    basicStats,
    currentStanding: null,
  });

  return {
    userId: asOpaqueId(input.userId),
    userName: "測定対象者",
    scopeType: input.scopeType,
    leagueId: input.leagueId ? asOpaqueId(input.leagueId) : null,
    seasonId: null,
    leagueName: input.leagueId ? "性能測定リーグ" : null,
    seasonName: null,
    ...basicStats,
    averageRank:
      input.matches.reduce((sum, match) => sum + match.rank, 0) /
      input.matches.length,
    firstRate: (rankCounts[0] ?? 0) / input.matches.length,
    secondRate: (rankCounts[1] ?? 0) / input.matches.length,
    thirdRate: (rankCounts[2] ?? 0) / input.matches.length,
    fourthRate: (rankCounts[3] ?? 0) / input.matches.length,
    highestScore: Math.max(...input.matches.map((match) => match.rawScore)),
    lowestScore: Math.min(...input.matches.map((match) => match.rawScore)),
    averageScore:
      input.matches.reduce((sum, match) => sum + match.rawScore, 0) /
      input.matches.length,
    winStreak: null,
    loseStreak: null,
    personalStatisticsVersion: 1,
    personalStatisticsSnapshot: snapshot,
  };
};

const main = async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is required; refusing to run outside the emulator",
    );
  }

  const db = getDb();
  const app = getFirebaseAdminApp();
  const userRepository = new FirestoreUserRepository(db);
  const baseLeagueRepository = new FirestoreLeagueRepository(
    db,
    userRepository,
  );
  const baseSeasonRepository = new FirestoreSeasonRepository(db);
  const baseUserStatsRepository = new FirestoreUserStatsRepository(db);
  const baseProjectionRepository = new FirestoreUserMatchStatisticsRepository(
    db,
  );
  const counter: Counter = { reads: 0 };
  const leagueRepository = {
    get: (...args: Parameters<typeof baseLeagueRepository.get>) =>
      baseLeagueRepository.get(...args),
    exists: async (...args: Parameters<typeof baseLeagueRepository.exists>) => {
      counter.reads += 1;
      return baseLeagueRepository.exists(...args);
    },
    areMembers: async (
      ...args: Parameters<typeof baseLeagueRepository.areMembers>
    ) => {
      const result = await baseLeagueRepository.areMembers(...args);
      if (result) counter.reads += 2;
      return result;
    },
  };
  const seasonRepository = {
    get: (...args: Parameters<typeof baseSeasonRepository.get>) =>
      baseSeasonRepository.get(...args),
    exists: async (...args: Parameters<typeof baseSeasonRepository.exists>) => {
      counter.reads += 1;
      return baseSeasonRepository.exists(...args);
    },
    areMembers: async (
      ...args: Parameters<typeof baseSeasonRepository.areMembers>
    ) => {
      const result = await baseSeasonRepository.areMembers(...args);
      if (result) counter.reads += 1;
      return result;
    },
  };
  const userStatsRepository = {
    getWithPersonalStatistics: async (
      ...args: Parameters<
        typeof baseUserStatsRepository.getWithPersonalStatistics
      >
    ) => {
      const result = await baseUserStatsRepository.getWithPersonalStatistics(
        ...args,
      );
      if (result) counter.reads += 1;
      return result;
    },
  };
  const projectionRepository = {
    listForScope: async (
      ...args: Parameters<typeof baseProjectionRepository.listForScope>
    ) => {
      const result = await baseProjectionRepository.listForScope(...args);
      counter.reads += result.length;
      return result;
    },
    listPage: async (
      ...args: Parameters<typeof baseProjectionRepository.listPage>
    ) => {
      const result = await baseProjectionRepository.listPage(...args);
      counter.reads += result.items.length + (result.nextCursor ? 1 : 0);
      return result;
    },
  };
  const services = createStatisticsServices({
    leagueRepository,
    seasonRepository,
    userStatsRepository,
    userMatchStatisticsRepository: projectionRepository,
  });

  const suffix = randomUUID().replaceAll("-", "");
  const viewerUserId = asOpaqueId(`perf-viewer-${suffix}`);
  const targetUserId = asOpaqueId(`perf-target-${suffix}`);
  const otherUserIds = [
    asOpaqueId(`perf-member-a-${suffix}`),
    asOpaqueId(`perf-member-b-${suffix}`),
  ];
  const memberIds = [viewerUserId, targetUserId, ...otherUserIds];
  const leagueId = `perf-league-${suffix}`;
  const rosterLeagueRepository = {
    areMembers: async (
      ...args: Parameters<typeof baseLeagueRepository.areMembers>
    ) => {
      const result = await baseLeagueRepository.areMembers(...args);
      if (result) counter.reads += 1;
      return result;
    },
    exists: async (...args: Parameters<typeof baseLeagueRepository.exists>) => {
      counter.reads += 1;
      return baseLeagueRepository.exists(...args);
    },
    listMembers: async (
      ...args: Parameters<typeof baseLeagueRepository.listMembers>
    ) => {
      const result = await baseLeagueRepository.listMembers(...args);
      counter.reads += 1 + result.length;
      return result;
    },
  } as unknown as LeagueRepository;
  const rosterSeasonRepository = {
    areMembers: async (
      ...args: Parameters<typeof baseSeasonRepository.areMembers>
    ) => {
      const result = await baseSeasonRepository.areMembers(...args);
      if (result) counter.reads += 1;
      return result;
    },
    exists: async (...args: Parameters<typeof baseSeasonRepository.exists>) => {
      counter.reads += 1;
      return baseSeasonRepository.exists(...args);
    },
    listMembers: async (
      ...args: Parameters<typeof baseSeasonRepository.listMembers>
    ) => {
      const result = await baseSeasonRepository.listMembers(...args);
      counter.reads += 1;
      return result;
    },
  } as unknown as SeasonRepository;
  const leagueService = new LeagueService(
    rosterLeagueRepository,
    userRepository,
    {} as StatsRebuilder,
  );
  const seasonService = new SeasonService(
    rosterLeagueRepository,
    rosterSeasonRepository,
    {} as MatchRepository,
    {} as StatsRebuilder,
  );
  const apiServices = {
    ...services,
    leagueService,
    seasonService,
  } as unknown as Services;
  const api = new Hono<AppBindings>()
    .use("/api/*", async (context, next) => {
      context.set("authUser", {
        uid: viewerUserId,
        email: null,
        name: "測定者",
        emailVerified: true,
      });
      await next();
    })
    .route("/api/users", buildUsersRouter(apiServices))
    .route("/api/leagues", buildLeaguesRouter(apiServices))
    .route("/api/leagues", buildSeasonsRouter(apiServices));
  const request = async (path: string) => {
    const response = await api.request(`http://localhost${path}`);
    const body = await response.arrayBuffer();
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${path}`);
    }
    return { responseBytes: body.byteLength };
  };
  const leagueRef = db.collection("leagues").doc(leagueId);
  const now = Timestamp.now();
  const seasonRepositoryForSetup = baseSeasonRepository;
  const statsKeys = [
    {
      userId: viewerUserId,
      scopeType: "overall" as const,
      leagueId: null,
      seasonId: null,
    },
    {
      userId: targetUserId,
      scopeType: "league" as const,
      leagueId,
      seasonId: null,
    },
  ];
  let seasonId = "";

  try {
    await leagueRef.set({ name: "性能測定リーグ", created_at: now });
    await Promise.all(
      memberIds.map((userId, index) =>
        leagueRef
          .collection("members")
          .doc(`member-${index}`)
          .set({
            id: `member-${index}`,
            user_id: userId,
            user_name: `参加者 ${index + 1}`,
          }),
      ),
    );
    const season = await seasonRepositoryForSetup.create(
      leagueId,
      {
        name: "性能測定シーズン",
        status: "archived",
        memberUserIds: memberIds.map((userId) => asOpaqueId(userId)),
      },
      memberIds.map((userId, index) => ({
        userId: asOpaqueId(userId),
        userName: `参加者 ${index + 1}`,
      })),
    );
    seasonId = String(season.id);

    const targetMatches = makeMatchRows({
      targetUserId,
      leagueId,
      seasonId,
      memberIds,
    });
    const viewerMatches = makeMatchRows({
      targetUserId: viewerUserId,
      leagueId,
      seasonId,
      memberIds,
    });
    const matches = [...targetMatches, ...viewerMatches];
    await baseProjectionRepository.replaceSeason({
      leagueId,
      seasonId,
      rows: matches,
    });
    for (const key of statsKeys) {
      await baseUserStatsRepository.upsert(key, {
        ...toStatsData({
          userId: key.userId,
          scopeType: key.scopeType,
          leagueId: key.leagueId,
          matches: key.userId === viewerUserId ? viewerMatches : targetMatches,
        }),
        seasonId: key.seasonId,
      });
    }

    const common = {
      from: asIsoDateString("2026-09-01T00:00:00+09:00"),
      to: asIsoDateString("2026-10-01T00:00:00+09:00"),
      gameType: "all" as const,
    };
    const queryString = (params: Record<string, string>) =>
      new URLSearchParams(params).toString();

    const measure = async (
      path: string,
      run: () => Promise<{ responseBytes: number }>,
    ) => {
      const durations: number[] = [];
      let lastBytes = 0;
      let lastReads = 0;
      const sample = async (timed: boolean) => {
        counter.reads = 0;
        const startedAt = performance.now();
        const result = await run();
        const endedAt = performance.now();
        lastBytes = result.responseBytes;
        lastReads = counter.reads;
        if (timed) durations.push(endedAt - startedAt);
      };
      for (let index = 0; index < WARMUP_COUNT; index += 1) {
        await sample(false);
      }
      for (let index = 0; index < SAMPLE_COUNT; index += 1) {
        await sample(true);
      }
      return {
        path,
        firestoreDocumentReadsPerRequest: lastReads,
        responseBytes: lastBytes,
        p95Ms: Number(percentile95(durations).toFixed(2)),
        sampleCount: durations.length,
      };
    };

    const scenarios: Array<[string, () => Promise<{ responseBytes: number }>]> =
      [
        [
          "self-fixed-summary",
          () =>
            request(
              `/api/users/${viewerUserId}/statistics?${queryString({ scopeType: "overall" })}`,
            ),
        ],
        [
          "other-member-league-summary",
          () =>
            request(
              `/api/users/${targetUserId}/statistics?${queryString({ scopeType: "league", leagueId })}`,
            ),
        ],
        [
          "self-arbitrary-period-summary",
          () =>
            request(
              `/api/users/${viewerUserId}/statistics?${queryString({
                scopeType: "overall",
                from: common.from,
                to: common.to,
                gameType: common.gameType,
              })}`,
            ),
        ],
        [
          "self-analysis-period",
          () =>
            request(
              `/api/users/${viewerUserId}/statistics/analysis?${queryString({
                scopeType: "overall",
                from: common.from,
                to: common.to,
                gameType: common.gameType,
                dimension: "period",
                groupBy: "day",
                windowSize: "20",
              })}`,
            ),
        ],
        [
          "self-history-first-page",
          () =>
            request(
              `/api/users/${viewerUserId}/statistics/matches?${queryString({ scopeType: "overall", limit: "50" })}`,
            ),
        ],
        [
          "initial-league-roster",
          () => request(`/api/leagues/${leagueId}/members`),
        ],
        [
          "initial-season-roster",
          () => request(`/api/leagues/${leagueId}/seasons/${seasonId}/members`),
        ],
      ];
    const report: unknown[] = [];
    for (const [path, run] of scenarios) {
      report.push(await measure(path, run));
    }

    process.stdout.write(
      `${JSON.stringify(
        {
          environment: "Firestore Emulator",
          fixture: {
            projectionDocuments: MATCH_COUNT * 2,
            leagueMembers: memberIds.length,
            samples: SAMPLE_COUNT,
            warmups: WARMUP_COUNT,
          },
          measurements: report,
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    if (seasonId) {
      await baseProjectionRepository.deleteSeason(leagueId, seasonId);
    }
    await Promise.all(
      statsKeys.map((key) =>
        db
          .collection("user_stats")
          .doc(String(buildUserStatsId(key)))
          .delete(),
      ),
    );
    await db.recursiveDelete(leagueRef);
    await deleteApp(app);
  }
};

await main();
