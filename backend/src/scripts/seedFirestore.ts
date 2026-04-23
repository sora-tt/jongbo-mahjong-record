import { getAdminAuth } from "@/infrastructure/firebase/client.js";
import { getDb } from "@/infrastructure/firestore/client.js";
import { Timestamp } from "firebase-admin/firestore";

type SeedUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  createdAt: string;
};

type SeedStanding = {
  userId: string;
  userName: string;
  totalPoints: number;
  matchCount: number;
  rank: number;
  firstCount: number;
  secondCount: number;
  thirdCount: number;
  fourthCount: number | null;
};

type SeedSeason = {
  id: string;
  name: string;
  status: "active" | "archived";
  members: Array<{ userId: string; userName: string }>;
  standings: SeedStanding[];
  createdAt: string;
};

type SeedLeague = {
  id: string;
  name: string;
  ruleId: string;
  ruleName: string;
  members: Array<{ userId: string; userName: string }>;
  activeSeasonId: string | null;
  activeSeasonName: string | null;
  seasons: SeedSeason[];
  leagueRecords: {
    winStreak: { value: number; userId: string; userName: string } | null;
    loseStreak: { value: number; userId: string; userName: string } | null;
    highestScore: { value: number; userId: string; userName: string } | null;
    lowestScore: { value: number; userId: string; userName: string } | null;
  } | null;
  createdAt: string;
};

const toTimestamp = (value: string) => Timestamp.fromDate(new Date(value));

const users: SeedUser[] = [
  {
    id: "0001",
    name: "岩田",
    email: "iwata@mail",
    username: "iwata",
    createdAt: "2000-10-03T00:00:00.000Z",
  },
  {
    id: "0002",
    name: "富田",
    email: "tomita@mail",
    username: "tomita",
    createdAt: "2000-09-30T00:00:00.000Z",
  },
  {
    id: "0003",
    name: "野口",
    email: "noguchi@mail",
    username: "noguchi",
    createdAt: "2000-07-28T00:00:00.000Z",
  },
  {
    id: "0004",
    name: "梶",
    email: "kaji@mail",
    username: "kaji",
    createdAt: "2000-10-04T00:00:00.000Z",
  },
  {
    id: "0005",
    name: "川上",
    email: "kawakami@mail",
    username: "kawakami",
    createdAt: "1999-04-13T00:00:00.000Z",
  },
  {
    id: "0006",
    name: "水島",
    email: "mizushima@mail",
    username: "mizushima",
    createdAt: "2001-09-11T00:00:00.000Z",
  },
  {
    id: "0007",
    name: "佐伯",
    email: "saeki@mail",
    username: "saeki",
    createdAt: "2000-02-17T00:00:00.000Z",
  },
  {
    id: "0008",
    name: "吉見",
    email: "yoshimi@mail",
    username: "yoshimi",
    createdAt: "2002-09-27T00:00:00.000Z",
  },
  {
    id: "0009",
    name: "梶本",
    email: "kajimoto@mail",
    username: "kajimoto",
    createdAt: "2000-10-04T00:00:00.000Z",
  },
];

const rules = [
  {
    id: "0001",
    name: "Mリーグルール",
    description: "frontend mock を元にした四麻ルール",
    gameType: "yonma",
    uma: { first: 20, second: 10, third: -10, fourth: -20 },
    oka: { startingPoints: 25000, returnPoints: 30000 },
    scoreCalculation: "decimal",
  },
  {
    id: "0002",
    name: "ラス回避ルール",
    description: "frontend mock を元にしたラス回避寄りルール",
    gameType: "yonma",
    uma: { first: 25, second: 10, third: -5, fourth: -30 },
    oka: { startingPoints: 25000, returnPoints: 30000 },
    scoreCalculation: "decimal",
  },
] as const;

const allMembers = users.map((user) => ({
  userId: user.id,
  userName: user.name,
}));

const leagues: SeedLeague[] = [
  {
    id: "000000",
    name: "雀望リーグ",
    ruleId: "0001",
    ruleName: "Mリーグルール",
    members: allMembers,
    activeSeasonId: "0001",
    activeSeasonName: "2026シーズン春夏",
    createdAt: "2000-09-04T00:00:00.000Z",
    leagueRecords: {
      winStreak: { value: 5, userId: "0001", userName: "岩田" },
      loseStreak: { value: 3, userId: "0002", userName: "富田" },
      highestScore: { value: 87800, userId: "0006", userName: "水島" },
      lowestScore: { value: -12000, userId: "0003", userName: "野口" },
    },
    seasons: [
      {
        id: "0001",
        name: "2026シーズン春夏",
        status: "active",
        createdAt: "2026-01-01T00:00:00.000Z",
        members: allMembers,
        standings: [
          {
            userId: "0001",
            userName: "岩田",
            totalPoints: 100,
            matchCount: 10,
            rank: 1,
            firstCount: 3,
            secondCount: 3,
            thirdCount: 2,
            fourthCount: 2,
          },
          {
            userId: "0002",
            userName: "富田",
            totalPoints: 50,
            matchCount: 10,
            rank: 2,
            firstCount: 2,
            secondCount: 3,
            thirdCount: 3,
            fourthCount: 2,
          },
          {
            userId: "0004",
            userName: "梶",
            totalPoints: 30,
            matchCount: 10,
            rank: 3,
            firstCount: 3,
            secondCount: 2,
            thirdCount: 2,
            fourthCount: 3,
          },
          {
            userId: "0007",
            userName: "佐伯",
            totalPoints: 20,
            matchCount: 10,
            rank: 4,
            firstCount: 3,
            secondCount: 1,
            thirdCount: 3,
            fourthCount: 3,
          },
          {
            userId: "0005",
            userName: "川上",
            totalPoints: 10,
            matchCount: 10,
            rank: 5,
            firstCount: 2,
            secondCount: 3,
            thirdCount: 2,
            fourthCount: 3,
          },
          {
            userId: "0009",
            userName: "梶本",
            totalPoints: 0,
            matchCount: 10,
            rank: 6,
            firstCount: 2,
            secondCount: 2,
            thirdCount: 2,
            fourthCount: 4,
          },
          {
            userId: "0003",
            userName: "野口",
            totalPoints: -20,
            matchCount: 10,
            rank: 7,
            firstCount: 2,
            secondCount: 2,
            thirdCount: 3,
            fourthCount: 3,
          },
          {
            userId: "0008",
            userName: "吉見",
            totalPoints: -30,
            matchCount: 10,
            rank: 8,
            firstCount: 2,
            secondCount: 1,
            thirdCount: 4,
            fourthCount: 3,
          },
          {
            userId: "0006",
            userName: "水島",
            totalPoints: -50,
            matchCount: 10,
            rank: 9,
            firstCount: 1,
            secondCount: 2,
            thirdCount: 4,
            fourthCount: 3,
          },
        ],
      },
      {
        id: "0002",
        name: "2026シーズン秋冬",
        status: "archived",
        createdAt: "2026-09-01T00:00:00.000Z",
        members: [{ userId: "0001", userName: "岩田" }],
        standings: [
          {
            userId: "0001",
            userName: "岩田",
            totalPoints: -125.4,
            matchCount: 18,
            rank: 1,
            firstCount: 3,
            secondCount: 2,
            thirdCount: 7,
            fourthCount: 6,
          },
        ],
      },
    ],
  },
  {
    id: "000001",
    name: "土田リーグ",
    ruleId: "0001",
    ruleName: "Mリーグルール",
    members: allMembers,
    activeSeasonId: "0003",
    activeSeasonName: "レギュラーシーズン",
    createdAt: "2000-09-04T00:00:00.000Z",
    leagueRecords: {
      winStreak: { value: 7, userId: "0001", userName: "岩田" },
      loseStreak: { value: 2, userId: "0001", userName: "岩田" },
      highestScore: { value: 87800, userId: "0006", userName: "水島" },
      lowestScore: { value: -15000, userId: "0003", userName: "野口" },
    },
    seasons: [
      {
        id: "0003",
        name: "レギュラーシーズン",
        status: "active",
        createdAt: "2026-01-15T00:00:00.000Z",
        members: [{ userId: "0001", userName: "岩田" }],
        standings: [
          {
            userId: "0001",
            userName: "岩田",
            totalPoints: 1104.4,
            matchCount: 142,
            rank: 1,
            firstCount: 45,
            secondCount: 38,
            thirdCount: 34,
            fourthCount: 25,
          },
        ],
      },
      {
        id: "0004",
        name: "ファイナルシーズン",
        status: "archived",
        createdAt: "2026-11-01T00:00:00.000Z",
        members: [{ userId: "0001", userName: "岩田" }],
        standings: [
          {
            userId: "0001",
            userName: "岩田",
            totalPoints: 42.1,
            matchCount: 6,
            rank: 2,
            firstCount: 2,
            secondCount: 1,
            thirdCount: 2,
            fourthCount: 1,
          },
        ],
      },
    ],
  },
];

const generatePointProgression = (standing: SeedStanding) => {
  if (standing.matchCount === 0) {
    return [];
  }

  return Array.from({ length: standing.matchCount }, (_, index) => ({
    match_index: index + 1,
    total_points: Number(
      (((index + 1) / standing.matchCount) * standing.totalPoints).toFixed(1),
    ),
  }));
};

const pickMaxRecord = (
  standings: SeedStanding[],
  selector: (standing: SeedStanding) => number,
) => {
  if (standings.length === 0) {
    return null;
  }

  const selected = standings
    .map((standing) => ({
      value: selector(standing),
      user_id: standing.userId,
      user_name: standing.userName,
    }))
    .sort((left, right) => right.value - left.value)[0];

  return selected ?? null;
};

const buildSeasonRecords = (standings: SeedStanding[]) => ({
  highest_score: pickMaxRecord(standings, (standing) => standing.totalPoints),
  avoid_last_rate: pickMaxRecord(standings, (standing) => {
    const fourthCount = standing.fourthCount ?? 0;
    return Number(
      (
        ((standing.matchCount - fourthCount) / standing.matchCount) *
        100
      ).toFixed(2),
    );
  }),
  top2_rate: pickMaxRecord(standings, (standing) =>
    Number(
      (
        ((standing.firstCount + standing.secondCount) / standing.matchCount) *
        100
      ).toFixed(2),
    ),
  ),
});

const clearDatabase = async () => {
  const db = getDb();
  const targets = ["user_stats", "leagues", "rules", "users"];
  for (const target of targets) {
    await db.recursiveDelete(db.collection(target));
  }
};

const seedUsers = async () => {
  const db = getDb();
  const batch = db.batch();
  const now = Timestamp.now();

  users.forEach((user) => {
    batch.set(db.collection("users").doc(user.id), {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      created_at: toTimestamp(user.createdAt),
      updated_at: now,
    });
  });

  await batch.commit();
};

const seedAuthUsers = async () => {
  const auth = getAdminAuth();
  const password = "password123";

  await Promise.all(
    users.map(async (user) => {
      try {
        await auth.createUser({
          uid: user.id,
          email: user.email,
          password,
          displayName: user.name,
          emailVerified: true,
        });
      } catch (error) {
        const code =
          typeof error === "object" && error !== null && "code" in error
            ? String(error.code)
            : "";
        if (
          !["auth/email-already-exists", "auth/uid-already-exists"].includes(
            code,
          )
        ) {
          throw error;
        }
      }
    }),
  );
};

const seedRules = async () => {
  const db = getDb();
  const batch = db.batch();
  const now = Timestamp.now();

  rules.forEach((rule) => {
    batch.set(db.collection("rules").doc(rule.id), {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      game_type: rule.gameType,
      uma: {
        first: rule.uma.first,
        second: rule.uma.second,
        third: rule.uma.third,
        fourth: rule.uma.fourth,
      },
      oka: {
        starting_points: rule.oka.startingPoints,
        return_points: rule.oka.returnPoints,
      },
      score_calculation: rule.scoreCalculation,
      created_at: now,
      updated_at: now,
    });
  });

  await batch.commit();
};

const seedLeagues = async () => {
  const db = getDb();
  const userStatsDocs: Array<{ id: string; data: Record<string, unknown> }> =
    [];

  for (const league of leagues) {
    const leagueRef = db.collection("leagues").doc(league.id);
    const totalMatchCount = league.seasons.reduce((sum, season) => {
      const seasonCount = Math.max(
        0,
        ...season.standings.map((standing) => standing.matchCount),
      );
      return sum + seasonCount;
    }, 0);

    await leagueRef.set({
      id: league.id,
      name: league.name,
      rule_id: league.ruleId,
      rule_name: league.ruleName,
      member_count: league.members.length,
      total_match_count: totalMatchCount,
      active_season_id: league.activeSeasonId,
      active_season_name: league.activeSeasonName,
      league_records: league.leagueRecords
        ? {
            win_streak: toRecordHolder(league.leagueRecords.winStreak),
            lose_streak: toRecordHolder(league.leagueRecords.loseStreak),
            highest_score: toRecordHolder(league.leagueRecords.highestScore),
            lowest_score: toRecordHolder(league.leagueRecords.lowestScore),
          }
        : null,
      created_at: toTimestamp(league.createdAt),
      updated_at: Timestamp.now(),
    });

    const memberBatch = db.batch();
    league.members.forEach((member) => {
      const memberRef = leagueRef.collection("members").doc(member.userId);
      memberBatch.set(memberRef, {
        id: member.userId,
        user_id: member.userId,
        user_name: member.userName,
      });
    });
    await memberBatch.commit();

    for (const season of league.seasons) {
      const seasonRef = leagueRef.collection("seasons").doc(season.id);
      const totalMatchCountForSeason = Math.max(
        0,
        ...season.standings.map((standing) => standing.matchCount),
      );
      const standings = season.standings
        .slice()
        .sort((left, right) => left.rank - right.rank)
        .map((standing) => ({
          rank: standing.rank,
          user_id: standing.userId,
          user_name: standing.userName,
          total_points: standing.totalPoints,
          match_count: standing.matchCount,
          first_count: standing.firstCount,
          second_count: standing.secondCount,
          third_count: standing.thirdCount,
          fourth_count: standing.fourthCount,
        }));

      await seasonRef.set({
        id: season.id,
        name: season.name,
        status: season.status,
        members: season.members.map((member) => ({
          user_id: member.userId,
          user_name: member.userName,
        })),
        member_count: season.members.length,
        total_match_count: totalMatchCountForSeason,
        standings,
        point_progressions: season.standings.map((standing) => ({
          user_id: standing.userId,
          user_name: standing.userName,
          points: generatePointProgression(standing),
        })),
        season_records: buildSeasonRecords(season.standings),
        created_at: toTimestamp(season.createdAt),
        updated_at: Timestamp.now(),
      });

      const sessionRef = seasonRef.collection("sessions").doc("demo-session");
      await sessionRef.set({
        id: "demo-session",
        started_at: toTimestamp(season.createdAt),
        ended_at: null,
        members: season.members
          .slice(0, Math.min(4, season.members.length))
          .map((member) => ({
            user_id: member.userId,
            user_name: member.userName,
          })),
        member_count: Math.min(4, season.members.length),
        total_match_count: 0,
        table_label: "A卓",
        created_by: season.members[0]?.userId ?? "0001",
        created_at: toTimestamp(season.createdAt),
        updated_at: Timestamp.now(),
      });

      season.standings.forEach((standing) => {
        userStatsDocs.push({
          id: `season_${league.id}_${season.id}_${standing.userId}`,
          data: createUserStatsDoc({
            id: `season_${league.id}_${season.id}_${standing.userId}`,
            userId: standing.userId,
            userName: standing.userName,
            scopeType: "season",
            leagueId: league.id,
            seasonId: season.id,
            leagueName: league.name,
            seasonName: season.name,
            totalPoints: standing.totalPoints,
            totalMatchCount: standing.matchCount,
            averageRank: averageRankFromStanding(standing),
            currentRank: standing.rank,
            firstCount: standing.firstCount,
            secondCount: standing.secondCount,
            thirdCount: standing.thirdCount,
            fourthCount: standing.fourthCount,
            highestScore:
              standing.totalPoints > 0 ? standing.totalPoints : null,
            lowestScore: standing.totalPoints < 0 ? standing.totalPoints : null,
          }),
        });
      });
    }

    const leagueStandingByUser = aggregateLeagueStanding(
      league.seasons.flatMap((season) => season.standings),
    );
    leagueStandingByUser.forEach((standing, index) => {
      userStatsDocs.push({
        id: `league_${league.id}_${standing.userId}`,
        data: createUserStatsDoc({
          id: `league_${league.id}_${standing.userId}`,
          userId: standing.userId,
          userName: standing.userName,
          scopeType: "league",
          leagueId: league.id,
          seasonId: null,
          leagueName: league.name,
          seasonName: null,
          totalPoints: Number(standing.totalPoints.toFixed(1)),
          totalMatchCount: standing.matchCount,
          averageRank: averageRankFromStanding(standing),
          currentRank: index + 1,
          firstCount: standing.firstCount,
          secondCount: standing.secondCount,
          thirdCount: standing.thirdCount,
          fourthCount: standing.fourthCount,
          highestScore: standing.totalPoints > 0 ? standing.totalPoints : null,
          lowestScore: standing.totalPoints < 0 ? standing.totalPoints : null,
        }),
      });
    });
  }

  const overallStanding = aggregateLeagueStanding(
    leagues.flatMap((league) =>
      league.seasons.flatMap((season) => season.standings),
    ),
  );
  overallStanding.forEach((standing) => {
    userStatsDocs.push({
      id: `overall_${standing.userId}`,
      data: createUserStatsDoc({
        id: `overall_${standing.userId}`,
        userId: standing.userId,
        userName: standing.userName,
        scopeType: "overall",
        leagueId: null,
        seasonId: null,
        leagueName: null,
        seasonName: null,
        totalPoints: Number(standing.totalPoints.toFixed(1)),
        totalMatchCount: standing.matchCount,
        averageRank: averageRankFromStanding(standing),
        currentRank: null,
        firstCount: standing.firstCount,
        secondCount: standing.secondCount,
        thirdCount: standing.thirdCount,
        fourthCount: standing.fourthCount,
        highestScore: standing.totalPoints > 0 ? standing.totalPoints : null,
        lowestScore: standing.totalPoints < 0 ? standing.totalPoints : null,
      }),
    });
  });

  const statsBatch = db.batch();
  userStatsDocs.forEach((doc) => {
    statsBatch.set(db.collection("user_stats").doc(doc.id), doc.data);
  });
  await statsBatch.commit();
};

const aggregateLeagueStanding = (standings: SeedStanding[]) => {
  const map = new Map<string, SeedStanding>();

  standings.forEach((standing) => {
    const current = map.get(standing.userId);
    if (!current) {
      map.set(standing.userId, { ...standing });
      return;
    }

    current.totalPoints += standing.totalPoints;
    current.matchCount += standing.matchCount;
    current.firstCount += standing.firstCount;
    current.secondCount += standing.secondCount;
    current.thirdCount += standing.thirdCount;
    current.fourthCount =
      (current.fourthCount ?? 0) + (standing.fourthCount ?? 0);
  });

  return [...map.values()].sort(
    (left, right) => right.totalPoints - left.totalPoints,
  );
};

const averageRankFromStanding = (standing: {
  matchCount: number;
  firstCount: number;
  secondCount: number;
  thirdCount: number;
  fourthCount: number | null;
}) => {
  if (standing.matchCount === 0) {
    return 0;
  }

  const totalRank =
    standing.firstCount * 1 +
    standing.secondCount * 2 +
    standing.thirdCount * 3 +
    (standing.fourthCount ?? 0) * 4;

  return Number((totalRank / standing.matchCount).toFixed(2));
};

const createUserStatsDoc = (params: {
  id: string;
  userId: string;
  userName: string;
  scopeType: "overall" | "league" | "season";
  leagueId: string | null;
  seasonId: string | null;
  leagueName: string | null;
  seasonName: string | null;
  totalPoints: number;
  totalMatchCount: number;
  averageRank: number;
  currentRank: number | null;
  firstCount: number;
  secondCount: number;
  thirdCount: number;
  fourthCount: number | null;
  highestScore: number | null;
  lowestScore: number | null;
}) => {
  const now = Timestamp.now();
  return {
    id: params.id,
    user_id: params.userId,
    user_name: params.userName,
    scope_type: params.scopeType,
    league_id: params.leagueId,
    season_id: params.seasonId,
    league_name: params.leagueName,
    season_name: params.seasonName,
    total_points: params.totalPoints,
    total_match_count: params.totalMatchCount,
    average_rank: params.averageRank,
    current_rank: params.currentRank,
    first_count: params.firstCount,
    second_count: params.secondCount,
    third_count: params.thirdCount,
    fourth_count: params.fourthCount,
    first_rate: rate(params.firstCount, params.totalMatchCount),
    second_rate: rate(params.secondCount, params.totalMatchCount),
    third_rate: rate(params.thirdCount, params.totalMatchCount),
    fourth_rate:
      params.fourthCount === null
        ? null
        : rate(params.fourthCount, params.totalMatchCount),
    highest_score: params.highestScore,
    lowest_score: params.lowestScore,
    average_score:
      params.totalMatchCount === 0
        ? null
        : Number((params.totalPoints / params.totalMatchCount).toFixed(2)),
    win_streak: null,
    lose_streak: null,
    created_at: now,
    updated_at: now,
  };
};

const rate = (value: number, total: number) =>
  total === 0 ? 0 : Number(((value / total) * 100).toFixed(2));

const toRecordHolder = (
  value: { value: number; userId: string; userName: string } | null,
) =>
  value
    ? {
        value: value.value,
        user_id: value.userId,
        user_name: value.userName,
      }
    : null;

const main = async () => {
  process.env.USE_FIRESTORE_EMULATOR =
    process.env.USE_FIRESTORE_EMULATOR ?? "true";
  process.env.FIRESTORE_EMULATOR_HOST =
    process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8081";
  process.env.FIREBASE_AUTH_EMULATOR_HOST =
    process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";
  process.env.GOOGLE_CLOUD_PROJECT =
    process.env.GOOGLE_CLOUD_PROJECT ?? "jongbo-local";

  console.log("seed start");
  await clearDatabase();
  await seedAuthUsers();
  await seedUsers();
  await seedRules();
  await seedLeagues();
  console.log("seed completed");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
