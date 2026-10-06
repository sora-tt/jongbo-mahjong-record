const jsonContent = (schema: Record<string, unknown>) => ({
  "application/json": {
    schema,
  },
});

const dataResponse = (schema: Record<string, unknown>) => ({
  type: "object",
  properties: {
    data: schema,
  },
  required: ["data"],
});

const errorResponse = {
  type: "object",
  properties: {
    error: {
      type: "object",
      properties: {
        code: { type: "string" },
        message: { type: "string" },
        details: { type: "object" },
      },
      required: ["code", "message", "details"],
    },
  },
  required: ["error"],
};

const statisticsPathParameter = {
  in: "path",
  name: "userId",
  required: true,
  description: "成績の表示対象者ID",
  schema: { type: "string" },
};

const statisticsQueryParameter = (
  name: string,
  schema: Record<string, unknown>,
  options: { required?: boolean; description?: string } = {},
) => ({
  in: "query",
  name,
  required: options.required ?? false,
  ...(options.description === undefined
    ? {}
    : { description: options.description }),
  schema,
});

const statisticsScopeQueryParameters = [
  statisticsQueryParameter(
    "scopeType",
    { type: "string", enum: ["overall", "league", "season"] },
    { required: true, description: "成績の集計範囲" },
  ),
  statisticsQueryParameter(
    "leagueId",
    { type: "string" },
    {
      description: "league/season scopeでは必須、overallでは指定不可",
    },
  ),
  statisticsQueryParameter(
    "seasonId",
    { type: "string" },
    {
      description: "season scopeでは必須、overall/leagueでは指定不可",
    },
  ),
  statisticsQueryParameter(
    "from",
    { type: "string", format: "date-time" },
    {
      description: "集計開始日時（含む）",
    },
  ),
  statisticsQueryParameter(
    "to",
    { type: "string", format: "date-time" },
    {
      description: "集計終了日時（含まない）",
    },
  ),
  statisticsQueryParameter("gameType", {
    type: "string",
    enum: ["all", "sanma", "yonma"],
  }),
];

const statisticsErrorResponses = {
  "400": {
    description: "validation error",
    content: jsonContent(errorResponse),
  },
  "401": {
    description: "authentication error",
    content: jsonContent(errorResponse),
  },
  "403": {
    description: "target is not allowed in this scope",
    content: jsonContent(errorResponse),
  },
  "404": {
    description: "league or season not found",
    content: jsonContent(errorResponse),
  },
  "500": {
    description: "statistics read failed",
    content: jsonContent(errorResponse),
  },
};

const statisticsComponentRef = (name: string) => ({
  $ref: `#/components/schemas/${name}`,
});

const statisticsSchemas = {
  StatisticsScope: {
    oneOf: [
      statisticsComponentRef("OverallStatisticsScope"),
      statisticsComponentRef("LeagueStatisticsScope"),
      statisticsComponentRef("SeasonStatisticsScope"),
    ],
    discriminator: {
      propertyName: "scopeType",
      mapping: {
        overall: "#/components/schemas/OverallStatisticsScope",
        league: "#/components/schemas/LeagueStatisticsScope",
        season: "#/components/schemas/SeasonStatisticsScope",
      },
    },
  },
  OverallStatisticsScope: {
    type: "object",
    properties: {
      scopeType: { type: "string", enum: ["overall"] },
      from: { type: "string", format: "date-time" },
      to: { type: "string", format: "date-time" },
      gameType: { type: "string", enum: ["all", "sanma", "yonma"] },
    },
    required: ["scopeType"],
    additionalProperties: false,
  },
  LeagueStatisticsScope: {
    type: "object",
    properties: {
      scopeType: { type: "string", enum: ["league"] },
      leagueId: { type: "string" },
      from: { type: "string", format: "date-time" },
      to: { type: "string", format: "date-time" },
      gameType: { type: "string", enum: ["all", "sanma", "yonma"] },
    },
    required: ["scopeType", "leagueId"],
    additionalProperties: false,
  },
  SeasonStatisticsScope: {
    type: "object",
    properties: {
      scopeType: { type: "string", enum: ["season"] },
      leagueId: { type: "string" },
      seasonId: { type: "string" },
      from: { type: "string", format: "date-time" },
      to: { type: "string", format: "date-time" },
      gameType: { type: "string", enum: ["all", "sanma", "yonma"] },
    },
    required: ["scopeType", "leagueId", "seasonId"],
    additionalProperties: false,
  },
  StatisticsRateCount: {
    type: "object",
    properties: {
      count: { type: "integer", minimum: 0 },
      denominator: { type: "integer", minimum: 0 },
      rate: { type: "number", nullable: true },
    },
    required: ["count", "denominator", "rate"],
  },
  StatisticsNumericSummary: {
    type: "object",
    properties: {
      matchCount: { type: "integer", minimum: 0 },
      average: { type: "number", nullable: true },
      maximum: { type: "number", nullable: true },
      minimum: { type: "number", nullable: true },
      median: { type: "number", nullable: true },
      populationStandardDeviation: { type: "number", nullable: true },
    },
    required: [
      "matchCount",
      "average",
      "maximum",
      "minimum",
      "median",
      "populationStandardDeviation",
    ],
  },
  StatisticsRankCount: {
    type: "object",
    properties: {
      rank: { type: "integer", minimum: 1 },
      count: { type: "integer", minimum: 0 },
      rate: { type: "number", nullable: true },
    },
    required: ["rank", "count", "rate"],
  },
  StatisticsFormatSummary: {
    type: "object",
    properties: {
      gameType: { type: "string", enum: ["sanma", "yonma"] },
      matchCount: { type: "integer", minimum: 0 },
      totalPoints: { type: "number" },
      averageFinalPoint: { type: "number", nullable: true },
      averageRank: { type: "number", nullable: true },
      ranks: {
        type: "array",
        items: statisticsComponentRef("StatisticsRankCount"),
      },
      topRate: { type: "number", nullable: true },
      topTwoRate: { type: "number", nullable: true },
      topThreeRate: { type: "number", nullable: true },
      lastRate: { type: "number", nullable: true },
      lastAvoidanceRate: { type: "number", nullable: true },
    },
    required: [
      "gameType",
      "matchCount",
      "totalPoints",
      "averageFinalPoint",
      "averageRank",
      "ranks",
      "topRate",
      "topTwoRate",
      "topThreeRate",
      "lastRate",
      "lastAvoidanceRate",
    ],
  },
  StatisticsSummaryTotals: {
    type: "object",
    properties: {
      totalMatchCount: { type: "integer", minimum: 0 },
      sessionCount: { type: "integer", minimum: 0 },
      totalPoints: { type: "number" },
      averageFinalPoint: { type: "number", nullable: true },
      chomboCount: { type: "integer", minimum: 0 },
    },
    required: [
      "totalMatchCount",
      "sessionCount",
      "totalPoints",
      "averageFinalPoint",
      "chomboCount",
    ],
  },
  StatisticsFinalPointSummary: {
    allOf: [
      statisticsComponentRef("StatisticsNumericSummary"),
      {
        type: "object",
        properties: {
          positive: statisticsComponentRef("StatisticsRateCount"),
          negative: statisticsComponentRef("StatisticsRateCount"),
          even: statisticsComponentRef("StatisticsRateCount"),
        },
        required: ["positive", "negative", "even"],
      },
    ],
  },
  StatisticsScoreByGameType: {
    type: "object",
    properties: {
      gameType: { type: "string", enum: ["sanma", "yonma"] },
      rawScore: statisticsComponentRef("StatisticsNumericSummary"),
      finalPoint: statisticsComponentRef("StatisticsFinalPointSummary"),
    },
    required: ["gameType", "rawScore", "finalPoint"],
  },
  StatisticsScoreByRank: {
    type: "object",
    properties: {
      gameType: { type: "string", enum: ["sanma", "yonma"] },
      rank: { type: "integer", minimum: 1 },
      matchCount: { type: "integer", minimum: 0 },
      averageRawScore: { type: "number", nullable: true },
      averageFinalPoint: { type: "number", nullable: true },
    },
    required: [
      "gameType",
      "rank",
      "matchCount",
      "averageRawScore",
      "averageFinalPoint",
    ],
  },
  StatisticsMatchReference: {
    type: "object",
    properties: {
      matchId: { type: "string" },
      leagueId: { type: "string" },
      leagueName: { type: "string" },
      seasonId: { type: "string" },
      seasonName: { type: "string" },
      sessionId: { type: "string" },
      sessionLabel: { type: "string", nullable: true },
      playedAt: { type: "string", format: "date-time" },
    },
    required: [
      "matchId",
      "leagueId",
      "leagueName",
      "seasonId",
      "seasonName",
      "sessionId",
      "sessionLabel",
      "playedAt",
    ],
  },
  StatisticsOpponentReference: {
    type: "object",
    properties: {
      userId: { type: "string" },
      userName: { type: "string" },
      rank: { type: "integer", minimum: 1 },
      finalPoint: { type: "number" },
    },
    required: ["userId", "userName", "rank", "finalPoint"],
  },
  StatisticsRecordMatchReference: {
    allOf: [
      statisticsComponentRef("StatisticsMatchReference"),
      {
        type: "object",
        properties: {
          opponents: {
            type: "array",
            items: statisticsComponentRef("StatisticsOpponentReference"),
          },
        },
        required: ["opponents"],
      },
    ],
  },
  StatisticsRecord: {
    type: "object",
    nullable: true,
    properties: {
      value: { type: "number" },
      match: statisticsComponentRef("StatisticsRecordMatchReference"),
    },
    required: ["value", "match"],
  },
  StatisticsStreak: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["top", "last", "topTwo", "positive", "negative"],
      },
      currentCount: { type: "integer", minimum: 0 },
      longestCount: { type: "integer", minimum: 0 },
    },
    required: ["type", "currentCount", "longestCount"],
  },
  StatisticsRecentResult: {
    type: "object",
    properties: {
      windowSize: { type: "integer", enum: [10, 20, 50] },
      matchCount: { type: "integer", minimum: 0 },
      totalPoints: { type: "number" },
      byGameType: {
        type: "array",
        items: statisticsComponentRef("StatisticsFormatSummary"),
      },
    },
    required: ["windowSize", "matchCount", "totalPoints", "byGameType"],
  },
  StatisticsCurrentStanding: {
    type: "object",
    nullable: true,
    properties: {
      rank: { type: "integer", minimum: 1 },
      totalPoints: { type: "number" },
      pointsBehindAbove: { type: "number", nullable: true },
      pointsAheadBelow: { type: "number", nullable: true },
      source: { type: "string", enum: ["season", "activeSeason"] },
    },
    required: [
      "rank",
      "totalPoints",
      "pointsBehindAbove",
      "pointsAheadBelow",
      "source",
    ],
  },
  StatisticsSummaryResult: {
    oneOf: [
      statisticsComponentRef("PersonalStatisticsSummary"),
      statisticsComponentRef("StatisticsSummaryUncomputed"),
    ],
    discriminator: {
      propertyName: "status",
      mapping: {
        ready: "#/components/schemas/PersonalStatisticsSummary",
        empty: "#/components/schemas/PersonalStatisticsSummary",
        uncomputed: "#/components/schemas/StatisticsSummaryUncomputed",
      },
    },
  },
  PersonalStatisticsSummary: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["ready", "empty"] },
      scope: statisticsComponentRef("StatisticsScope"),
      generatedAt: { type: "string", format: "date-time" },
      timeZone: { type: "string", enum: ["Asia/Tokyo"] },
      totals: statisticsComponentRef("StatisticsSummaryTotals"),
      byGameType: {
        type: "array",
        items: statisticsComponentRef("StatisticsFormatSummary"),
      },
      scoreByGameType: {
        type: "array",
        items: statisticsComponentRef("StatisticsScoreByGameType"),
      },
      rawScore: statisticsComponentRef("StatisticsNumericSummary"),
      finalPoint: statisticsComponentRef("StatisticsFinalPointSummary"),
      scoreByRank: {
        type: "array",
        items: statisticsComponentRef("StatisticsScoreByRank"),
      },
      records: {
        type: "object",
        properties: {
          highestRawScore: {
            ...statisticsComponentRef("StatisticsRecord"),
          },
          lowestRawScore: {
            ...statisticsComponentRef("StatisticsRecord"),
          },
          highestFinalPoint: {
            ...statisticsComponentRef("StatisticsRecord"),
          },
          lowestFinalPoint: {
            ...statisticsComponentRef("StatisticsRecord"),
          },
        },
        required: [
          "highestRawScore",
          "lowestRawScore",
          "highestFinalPoint",
          "lowestFinalPoint",
        ],
      },
      streaks: {
        type: "array",
        items: statisticsComponentRef("StatisticsStreak"),
      },
      recentResults: {
        type: "array",
        items: statisticsComponentRef("StatisticsRecentResult"),
      },
      currentStanding: {
        ...statisticsComponentRef("StatisticsCurrentStanding"),
      },
    },
    required: [
      "status",
      "scope",
      "generatedAt",
      "timeZone",
      "totals",
      "byGameType",
      "scoreByGameType",
      "rawScore",
      "finalPoint",
      "scoreByRank",
      "records",
      "streaks",
      "recentResults",
      "currentStanding",
    ],
  },
  StatisticsSummaryUncomputed: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["uncomputed"] },
      scope: statisticsComponentRef("StatisticsScope"),
      generatedAt: { type: "string", nullable: true, enum: [null] },
      timeZone: { type: "string", enum: ["Asia/Tokyo"] },
    },
    required: ["status", "scope", "generatedAt", "timeZone"],
  },
  StatisticsProgressionPoint: {
    type: "object",
    properties: {
      playedAt: { type: "string", format: "date-time" },
      matchId: { type: "string" },
      matchIndex: { type: "integer", minimum: 0 },
      gameType: { type: "string", enum: ["sanma", "yonma"] },
      point: { type: "number" },
      cumulativePoint: { type: "number" },
    },
    required: [
      "playedAt",
      "matchId",
      "matchIndex",
      "gameType",
      "point",
      "cumulativePoint",
    ],
  },
  StatisticsBreakdownFixedRow: {
    type: "object",
    properties: {
      key: { type: "string" },
      label: { type: "string" },
      gameType: { type: "string", enum: ["sanma", "yonma"] },
      matchCount: { type: "integer", minimum: 0 },
      denominator: { type: "integer", minimum: 0 },
      totalPoints: { type: "number" },
      averageRank: { type: "number", nullable: true },
      topRate: { type: "number", nullable: true },
      averageFinalPoint: { type: "number", nullable: true },
      rankCounts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            rank: { type: "integer", minimum: 1 },
            count: { type: "integer", minimum: 0 },
          },
          required: ["rank", "count"],
        },
      },
    },
    required: [
      "key",
      "label",
      "gameType",
      "matchCount",
      "denominator",
      "totalPoints",
      "averageRank",
      "topRate",
      "averageFinalPoint",
      "rankCounts",
    ],
  },
  StatisticsBreakdownOpponentRow: {
    type: "object",
    properties: {
      userId: { type: "string" },
      userName: { type: "string" },
      gameType: { type: "string", enum: ["sanma", "yonma"] },
      encounterCount: { type: "integer", minimum: 0 },
      aboveRate: { type: "number", nullable: true },
      tieCount: { type: "integer", minimum: 0 },
      totalPointDifference: { type: "number" },
      averagePointDifference: { type: "number" },
    },
    required: [
      "userId",
      "userName",
      "gameType",
      "encounterCount",
      "aboveRate",
      "tieCount",
      "totalPointDifference",
      "averagePointDifference",
    ],
  },
  StatisticsBreakdownSessionRow: {
    type: "object",
    properties: {
      sessionId: { type: "string" },
      label: { type: "string" },
      matchCount: { type: "integer", minimum: 0 },
      totalPoints: { type: "number" },
      averageRankByGameType: {
        type: "array",
        items: statisticsComponentRef("StatisticsFormatSummary"),
      },
      topCountByGameType: {
        type: "array",
        items: {
          type: "object",
          properties: {
            gameType: { type: "string", enum: ["sanma", "yonma"] },
            count: { type: "integer", minimum: 0 },
          },
          required: ["gameType", "count"],
        },
      },
    },
    required: [
      "sessionId",
      "label",
      "matchCount",
      "totalPoints",
      "averageRankByGameType",
      "topCountByGameType",
    ],
  },
  StatisticsBreakdown: {
    oneOf: [
      statisticsComponentRef("StatisticsFixedBreakdown"),
      statisticsComponentRef("StatisticsOpponentBreakdown"),
      statisticsComponentRef("StatisticsSessionBreakdown"),
    ],
    discriminator: {
      propertyName: "dimension",
      mapping: {
        period: "#/components/schemas/StatisticsFixedBreakdown",
        weekday: "#/components/schemas/StatisticsFixedBreakdown",
        timeOfDay: "#/components/schemas/StatisticsFixedBreakdown",
        seat: "#/components/schemas/StatisticsFixedBreakdown",
        opponent: "#/components/schemas/StatisticsOpponentBreakdown",
        session: "#/components/schemas/StatisticsSessionBreakdown",
      },
    },
  },
  StatisticsFixedBreakdown: {
    type: "object",
    properties: {
      dimension: {
        type: "string",
        enum: ["period", "weekday", "timeOfDay", "seat"],
      },
      rows: {
        type: "array",
        items: statisticsComponentRef("StatisticsBreakdownFixedRow"),
      },
      nextCursor: { type: "string", nullable: true, enum: [null] },
    },
    required: ["dimension", "rows", "nextCursor"],
  },
  StatisticsOpponentBreakdown: {
    type: "object",
    properties: {
      dimension: { type: "string", enum: ["opponent"] },
      rows: {
        type: "array",
        items: statisticsComponentRef("StatisticsBreakdownOpponentRow"),
      },
      nextCursor: { type: "string", nullable: true },
    },
    required: ["dimension", "rows", "nextCursor"],
  },
  StatisticsSessionBreakdown: {
    type: "object",
    properties: {
      dimension: { type: "string", enum: ["session"] },
      rows: {
        type: "array",
        items: statisticsComponentRef("StatisticsBreakdownSessionRow"),
      },
      nextCursor: { type: "string", nullable: true },
    },
    required: ["dimension", "rows", "nextCursor"],
  },
  StatisticsAnalysisResult: {
    oneOf: [
      statisticsComponentRef("StatisticsAnalysisReadyOrEmpty"),
      statisticsComponentRef("StatisticsAnalysisUncomputed"),
    ],
    discriminator: {
      propertyName: "status",
      mapping: {
        ready: "#/components/schemas/StatisticsAnalysisReadyOrEmpty",
        empty: "#/components/schemas/StatisticsAnalysisReadyOrEmpty",
        uncomputed: "#/components/schemas/StatisticsAnalysisUncomputed",
      },
    },
  },
  StatisticsAnalysisReadyOrEmpty: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["ready", "empty"] },
      scope: statisticsComponentRef("StatisticsScope"),
      generatedAt: { type: "string", format: "date-time" },
      timeZone: { type: "string", enum: ["Asia/Tokyo"] },
      windowSize: { type: "integer", enum: [10, 20, 50] },
      progression: {
        type: "array",
        maxItems: 50,
        items: statisticsComponentRef("StatisticsProgressionPoint"),
      },
      breakdown: statisticsComponentRef("StatisticsBreakdown"),
    },
    required: [
      "status",
      "scope",
      "generatedAt",
      "timeZone",
      "windowSize",
      "progression",
      "breakdown",
    ],
  },
  StatisticsAnalysisUncomputed: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["uncomputed"] },
      scope: statisticsComponentRef("StatisticsScope"),
      generatedAt: { type: "string", nullable: true, enum: [null] },
      timeZone: { type: "string", enum: ["Asia/Tokyo"] },
      windowSize: { type: "integer", enum: [10, 20, 50] },
    },
    required: ["status", "scope", "generatedAt", "timeZone", "windowSize"],
  },
  StatisticsMatchItem: {
    type: "object",
    properties: {
      match: statisticsComponentRef("StatisticsMatchReference"),
      gameType: { type: "string", enum: ["sanma", "yonma"] },
      wind: { type: "string", enum: ["east", "south", "west", "north"] },
      rank: { type: "integer", minimum: 1 },
      rawScore: { type: "number" },
      finalPoint: { type: "number" },
      opponents: {
        type: "array",
        items: statisticsComponentRef("StatisticsOpponentReference"),
      },
    },
    required: [
      "match",
      "gameType",
      "wind",
      "rank",
      "rawScore",
      "finalPoint",
      "opponents",
    ],
  },
  StatisticsMatchHistoryReady: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["ready"] },
      scope: statisticsComponentRef("StatisticsScope"),
      generatedAt: { type: "string", format: "date-time" },
      timeZone: { type: "string", enum: ["Asia/Tokyo"] },
      items: {
        type: "array",
        items: statisticsComponentRef("StatisticsMatchItem"),
      },
      nextCursor: { type: "string", nullable: true },
    },
    required: [
      "status",
      "scope",
      "generatedAt",
      "timeZone",
      "items",
      "nextCursor",
    ],
  },
  StatisticsMatchHistoryEmpty: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["empty"] },
      scope: statisticsComponentRef("StatisticsScope"),
      generatedAt: { type: "string", format: "date-time" },
      timeZone: { type: "string", enum: ["Asia/Tokyo"] },
      items: {
        type: "array",
        items: statisticsComponentRef("StatisticsMatchItem"),
        maxItems: 0,
      },
      nextCursor: { type: "string", nullable: true, enum: [null] },
    },
    required: [
      "status",
      "scope",
      "generatedAt",
      "timeZone",
      "items",
      "nextCursor",
    ],
  },
  StatisticsMatchHistoryUncomputed: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["uncomputed"] },
      scope: statisticsComponentRef("StatisticsScope"),
      generatedAt: { type: "string", nullable: true, enum: [null] },
      timeZone: { type: "string", enum: ["Asia/Tokyo"] },
      items: {
        type: "array",
        items: statisticsComponentRef("StatisticsMatchItem"),
        maxItems: 0,
      },
      nextCursor: { type: "string", nullable: true, enum: [null] },
    },
    required: [
      "status",
      "scope",
      "generatedAt",
      "timeZone",
      "items",
      "nextCursor",
    ],
  },
  StatisticsMatchPageResult: {
    oneOf: [
      statisticsComponentRef("StatisticsMatchHistoryReady"),
      statisticsComponentRef("StatisticsMatchHistoryEmpty"),
      statisticsComponentRef("StatisticsMatchHistoryUncomputed"),
    ],
    discriminator: {
      propertyName: "status",
      mapping: {
        ready: "#/components/schemas/StatisticsMatchHistoryReady",
        empty: "#/components/schemas/StatisticsMatchHistoryEmpty",
        uncomputed: "#/components/schemas/StatisticsMatchHistoryUncomputed",
      },
    },
  },
};

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Jongbo API",
    version: "1.0.0",
    description: "麻雀記録アプリ backend API",
  },
  servers: [
    {
      url: "/",
      description: "same origin",
    },
  ],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Users" },
    { name: "Leagues" },
    { name: "Seasons" },
    { name: "Sessions" },
    { name: "Matches" },
  ],
  security: [{ cookieAuth: [] }],
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "health check",
        security: [],
        responses: {
          "200": {
            description: "ok",
            content: jsonContent(
              dataResponse({
                type: "object",
                properties: {
                  status: { type: "string", example: "ok" },
                  timestamp: { type: "string", format: "date-time" },
                },
                required: ["status", "timestamp"],
              }),
            ),
          },
        },
      },
    },
    "/api/auth/session": {
      post: {
        tags: ["Auth"],
        summary: "create session cookie",
        security: [],
        parameters: [
          {
            in: "header",
            name: "x-id-token",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "201": {
            description: "session created",
            content: jsonContent(
              dataResponse({
                type: "object",
                properties: {
                  authenticated: { type: "boolean" },
                  expiresAt: { type: "string", format: "date-time" },
                },
                required: ["authenticated", "expiresAt"],
              }),
            ),
          },
        },
      },
      delete: {
        tags: ["Auth"],
        summary: "delete session cookie",
        security: [],
        responses: {
          "204": {
            description: "deleted",
          },
        },
      },
    },
    "/api/auth/verification-email": {
      post: {
        tags: ["Auth"],
        summary: "send verification email",
        responses: {
          "200": {
            description: "verification email generated",
            content: jsonContent(
              dataResponse({
                type: "object",
                properties: {
                  sent: { type: "boolean" },
                  email: { type: "string" },
                  verificationUrl: { type: "string" },
                  retryAfterSeconds: { type: "integer", minimum: 0 },
                  expiresAt: { type: "string", format: "date-time" },
                },
                required: [
                  "sent",
                  "email",
                  "verificationUrl",
                  "retryAfterSeconds",
                  "expiresAt",
                ],
              }),
            ),
          },
        },
      },
    },
    "/api/auth/verify-email": {
      post: {
        tags: ["Auth"],
        summary: "confirm a verification action code",
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            properties: {
              oobCode: { type: "string" },
            },
            required: ["oobCode"],
          }),
        },
        responses: {
          "200": {
            description: "verification confirmed",
            content: jsonContent(
              dataResponse({
                type: "object",
                properties: {
                  verified: { type: "boolean" },
                  email: { type: "string" },
                  verifiedAt: { type: "string", format: "date-time" },
                },
                required: ["verified", "email", "verifiedAt"],
              }),
            ),
          },
        },
      },
    },
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "search users by username",
        parameters: [
          {
            in: "query",
            name: "query",
            required: false,
            description: "username partial match",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "users",
            content: jsonContent(
              dataResponse({
                type: "array",
                items: { $ref: "#/components/schemas/User" },
              }),
            ),
          },
        },
      },
    },
    "/api/users/{userId}": {
      get: {
        tags: ["Users"],
        summary: "get user",
        parameters: [
          {
            in: "path",
            name: "userId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "user",
            content: jsonContent(
              dataResponse({ $ref: "#/components/schemas/User" }),
            ),
          },
          "404": {
            description: "not found",
            content: jsonContent(errorResponse),
          },
        },
      },
    },
    "/api/users/me": {
      post: {
        tags: ["Users"],
        summary: "create or sync current user profile",
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            properties: {
              name: { type: "string" },
              username: { type: "string" },
            },
            required: ["name", "username"],
          }),
        },
        responses: {
          "201": {
            description: "user",
            content: jsonContent(
              dataResponse({ $ref: "#/components/schemas/User" }),
            ),
          },
        },
      },
      get: {
        tags: ["Users"],
        summary: "get current user",
        responses: {
          "200": {
            description: "user",
            content: jsonContent(
              dataResponse({ $ref: "#/components/schemas/User" }),
            ),
          },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "update current user",
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            properties: {
              name: { type: "string" },
              username: { type: "string" },
            },
          }),
        },
        responses: {
          "200": {
            description: "user",
            content: jsonContent(
              dataResponse({ $ref: "#/components/schemas/User" }),
            ),
          },
        },
      },
    },
    "/api/users/{userId}/joining-seasons": {
      get: {
        tags: ["Users"],
        summary: "list joining seasons",
        parameters: [
          {
            in: "path",
            name: "userId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "joining seasons",
            content: jsonContent(
              dataResponse({
                type: "array",
                items: { $ref: "#/components/schemas/JoiningSeason" },
              }),
            ),
          },
        },
      },
    },
    "/api/users/{userId}/stats": {
      get: {
        tags: ["Users"],
        summary: "get user stats",
        parameters: [
          {
            in: "path",
            name: "userId",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "query",
            name: "scopeType",
            required: true,
            schema: { type: "string", enum: ["overall", "league", "season"] },
          },
          {
            in: "query",
            name: "leagueId",
            required: false,
            schema: { type: "string" },
          },
          {
            in: "query",
            name: "seasonId",
            required: false,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "stats",
            content: jsonContent(
              dataResponse({ $ref: "#/components/schemas/UserStats" }),
            ),
          },
          "400": {
            description: "validation error",
            content: jsonContent(errorResponse),
          },
          "404": {
            description: "not found",
            content: jsonContent(errorResponse),
          },
        },
      },
    },
    "/api/users/{userId}/statistics": {
      get: {
        tags: ["Users"],
        summary: "get personal statistics summary",
        description:
          "Returns the target user's saved or date-filtered summary. Uncomputed and empty scopes are represented by response status.",
        parameters: [
          statisticsPathParameter,
          ...statisticsScopeQueryParameters,
        ],
        responses: {
          "200": {
            description: "personal statistics summary",
            content: jsonContent(
              dataResponse({
                $ref: "#/components/schemas/StatisticsSummaryResult",
              }),
            ),
          },
          ...statisticsErrorResponses,
        },
      },
    },
    "/api/users/{userId}/statistics/analysis": {
      get: {
        tags: ["Users"],
        summary: "get personal statistics analysis",
        description:
          "Returns one selected breakdown and point progression. limit and cursor apply only to opponent/session dimensions.",
        parameters: [
          statisticsPathParameter,
          ...statisticsScopeQueryParameters,
          statisticsQueryParameter(
            "dimension",
            {
              type: "string",
              enum: [
                "period",
                "weekday",
                "timeOfDay",
                "seat",
                "opponent",
                "session",
              ],
            },
            { required: true },
          ),
          statisticsQueryParameter(
            "groupBy",
            { type: "string", enum: ["day", "month", "year"] },
            { description: "period dimensionで使う分類単位" },
          ),
          statisticsQueryParameter(
            "windowSize",
            { type: "integer", enum: [10, 20, 50] },
            { required: true, description: "累計推移に含める直近対局数" },
          ),
          statisticsQueryParameter(
            "limit",
            { type: "integer", minimum: 1, maximum: 100, default: 20 },
            { description: "opponent/session内訳のpage size" },
          ),
          statisticsQueryParameter(
            "cursor",
            { type: "string" },
            { description: "opponent/session内訳のopaque continuation token" },
          ),
        ],
        responses: {
          "200": {
            description: "personal statistics analysis",
            content: jsonContent(
              dataResponse({
                $ref: "#/components/schemas/StatisticsAnalysisResult",
              }),
            ),
          },
          ...statisticsErrorResponses,
        },
      },
    },
    "/api/users/{userId}/statistics/matches": {
      get: {
        tags: ["Users"],
        summary: "list personal statistics match history",
        description:
          "Returns recorded match fields in stable descending order with an opaque nextCursor.",
        parameters: [
          statisticsPathParameter,
          ...statisticsScopeQueryParameters,
          statisticsQueryParameter(
            "limit",
            { type: "integer", minimum: 1, maximum: 100, default: 50 },
            { description: "history page size" },
          ),
          statisticsQueryParameter(
            "cursor",
            { type: "string" },
            { description: "opaque continuation token" },
          ),
        ],
        responses: {
          "200": {
            description: "personal statistics match history page",
            content: jsonContent(
              dataResponse({
                $ref: "#/components/schemas/StatisticsMatchPageResult",
              }),
            ),
          },
          ...statisticsErrorResponses,
        },
      },
    },
    "/api/leagues": {
      get: {
        tags: ["Leagues"],
        summary: "list leagues",
        responses: {
          "200": {
            description: "leagues",
            content: jsonContent(
              dataResponse({
                type: "array",
                items: { $ref: "#/components/schemas/LeagueSummary" },
              }),
            ),
          },
        },
      },
      post: {
        tags: ["Leagues"],
        summary: "create league",
        requestBody: {
          required: true,
          content: jsonContent({
            $ref: "#/components/schemas/CreateLeagueInput",
          }),
        },
        responses: {
          "201": {
            description: "created league",
            content: jsonContent(
              dataResponse({ $ref: "#/components/schemas/LeagueDetail" }),
            ),
          },
          "400": {
            description: "validation error",
            content: jsonContent(errorResponse),
          },
        },
      },
    },
    "/api/leagues/{leagueId}": {
      get: {
        tags: ["Leagues"],
        summary: "get league",
        parameters: [
          {
            in: "path",
            name: "leagueId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "league detail",
            content: jsonContent(
              dataResponse({ $ref: "#/components/schemas/LeagueDetail" }),
            ),
          },
          "404": {
            description: "not found",
            content: jsonContent(errorResponse),
          },
        },
      },
      patch: {
        tags: ["Leagues"],
        summary: "update league",
        parameters: [
          {
            in: "path",
            name: "leagueId",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            properties: {
              name: { type: "string" },
              rule: { $ref: "#/components/schemas/LeagueRule" },
              memberUserIds: { type: "array", items: { type: "string" } },
            },
          }),
        },
        responses: {
          "200": {
            description: "league detail",
            content: jsonContent(
              dataResponse({ $ref: "#/components/schemas/LeagueDetail" }),
            ),
          },
        },
      },
      delete: {
        tags: ["Leagues"],
        summary: "delete league",
        parameters: [
          {
            in: "path",
            name: "leagueId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "204": {
            description: "deleted",
          },
        },
      },
    },
    "/api/leagues/{leagueId}/members": {
      get: {
        tags: ["Leagues"],
        summary: "list league members",
        parameters: [
          {
            in: "path",
            name: "leagueId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "members",
            content: jsonContent(
              dataResponse({
                type: "array",
                items: { $ref: "#/components/schemas/LeagueMember" },
              }),
            ),
          },
        },
      },
    },
    "/api/leagues/{leagueId}/seasons": {
      get: {
        tags: ["Seasons"],
        summary: "list seasons",
        parameters: [
          {
            in: "path",
            name: "leagueId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "seasons",
            content: jsonContent(
              dataResponse({
                type: "array",
                items: { $ref: "#/components/schemas/SeasonSummary" },
              }),
            ),
          },
        },
      },
      post: {
        tags: ["Seasons"],
        summary: "create season",
        parameters: [
          {
            in: "path",
            name: "leagueId",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: jsonContent({
            $ref: "#/components/schemas/CreateSeasonInput",
          }),
        },
        responses: {
          "201": {
            description: "season detail",
            content: jsonContent(
              dataResponse({ $ref: "#/components/schemas/SeasonDetail" }),
            ),
          },
        },
      },
    },
    "/api/leagues/{leagueId}/seasons/{seasonId}": {
      get: {
        tags: ["Seasons"],
        summary: "get season",
        parameters: [
          {
            in: "path",
            name: "leagueId",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "path",
            name: "seasonId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "season detail",
            content: jsonContent(
              dataResponse({ $ref: "#/components/schemas/SeasonDetail" }),
            ),
          },
        },
      },
      patch: {
        tags: ["Seasons"],
        summary: "update season",
        parameters: [
          {
            in: "path",
            name: "leagueId",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "path",
            name: "seasonId",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            properties: {
              name: { type: "string" },
              status: { type: "string", enum: ["active", "archived"] },
            },
          }),
        },
        responses: {
          "200": {
            description: "season detail",
            content: jsonContent(
              dataResponse({ $ref: "#/components/schemas/SeasonDetail" }),
            ),
          },
        },
      },
      delete: {
        tags: ["Seasons"],
        summary: "delete season",
        parameters: [
          {
            in: "path",
            name: "leagueId",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "path",
            name: "seasonId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "204": {
            description: "deleted",
          },
        },
      },
    },
    "/api/leagues/{leagueId}/seasons/{seasonId}/members": {
      get: {
        tags: ["Seasons"],
        summary: "list season members",
        parameters: [
          {
            in: "path",
            name: "leagueId",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "path",
            name: "seasonId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "season members",
            content: jsonContent(
              dataResponse({
                type: "array",
                items: { $ref: "#/components/schemas/SeasonMember" },
              }),
            ),
          },
        },
      },
    },
    "/api/leagues/{leagueId}/seasons/{seasonId}/sessions": {
      get: {
        tags: ["Sessions"],
        summary: "list sessions",
        parameters: [
          {
            in: "path",
            name: "leagueId",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "path",
            name: "seasonId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "sessions",
            content: jsonContent(
              dataResponse({
                type: "array",
                items: { $ref: "#/components/schemas/Session" },
              }),
            ),
          },
        },
      },
      post: {
        tags: ["Sessions"],
        summary: "create session",
        parameters: [
          {
            in: "path",
            name: "leagueId",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "path",
            name: "seasonId",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: jsonContent({
            $ref: "#/components/schemas/CreateSessionInput",
          }),
        },
        responses: {
          "201": {
            description: "session",
            content: jsonContent(
              dataResponse({ $ref: "#/components/schemas/Session" }),
            ),
          },
        },
      },
    },
    "/api/leagues/{leagueId}/seasons/{seasonId}/sessions/{sessionId}": {
      get: {
        tags: ["Sessions"],
        summary: "get session",
        parameters: [
          {
            in: "path",
            name: "leagueId",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "path",
            name: "seasonId",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "path",
            name: "sessionId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "session",
            content: jsonContent(
              dataResponse({ $ref: "#/components/schemas/Session" }),
            ),
          },
        },
      },
      patch: {
        tags: ["Sessions"],
        summary: "update session",
        parameters: [
          {
            in: "path",
            name: "leagueId",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "path",
            name: "seasonId",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "path",
            name: "sessionId",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            properties: {
              endedAt: {
                type: "string",
                format: "date-time",
                nullable: true,
              },
              tableLabel: { type: "string", nullable: true },
            },
          }),
        },
        responses: {
          "200": {
            description: "session",
            content: jsonContent(
              dataResponse({ $ref: "#/components/schemas/Session" }),
            ),
          },
        },
      },
      delete: {
        tags: ["Sessions"],
        summary: "delete session",
        parameters: [
          {
            in: "path",
            name: "leagueId",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "path",
            name: "seasonId",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "path",
            name: "sessionId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "204": {
            description: "deleted",
          },
        },
      },
    },
    "/api/leagues/{leagueId}/seasons/{seasonId}/sessions/{sessionId}/matches": {
      get: {
        tags: ["Matches"],
        summary: "list matches",
        parameters: [
          {
            in: "path",
            name: "leagueId",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "path",
            name: "seasonId",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "path",
            name: "sessionId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "matches",
            content: jsonContent(
              dataResponse({
                type: "array",
                items: { $ref: "#/components/schemas/Match" },
              }),
            ),
          },
        },
      },
      post: {
        tags: ["Matches"],
        summary: "create match",
        parameters: [
          {
            in: "path",
            name: "leagueId",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "path",
            name: "seasonId",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "path",
            name: "sessionId",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: jsonContent({
            $ref: "#/components/schemas/CreateMatchInput",
          }),
        },
        responses: {
          "201": {
            description: "match",
            content: jsonContent(
              dataResponse({ $ref: "#/components/schemas/Match" }),
            ),
          },
        },
      },
    },
    "/api/leagues/{leagueId}/seasons/{seasonId}/sessions/{sessionId}/matches/{matchId}":
      {
        get: {
          tags: ["Matches"],
          summary: "get match",
          parameters: [
            {
              in: "path",
              name: "leagueId",
              required: true,
              schema: { type: "string" },
            },
            {
              in: "path",
              name: "seasonId",
              required: true,
              schema: { type: "string" },
            },
            {
              in: "path",
              name: "sessionId",
              required: true,
              schema: { type: "string" },
            },
            {
              in: "path",
              name: "matchId",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "match",
              content: jsonContent(
                dataResponse({ $ref: "#/components/schemas/Match" }),
              ),
            },
          },
        },
        patch: {
          tags: ["Matches"],
          summary: "update match",
          parameters: [
            {
              in: "path",
              name: "leagueId",
              required: true,
              schema: { type: "string" },
            },
            {
              in: "path",
              name: "seasonId",
              required: true,
              schema: { type: "string" },
            },
            {
              in: "path",
              name: "sessionId",
              required: true,
              schema: { type: "string" },
            },
            {
              in: "path",
              name: "matchId",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: jsonContent({
              type: "object",
              properties: {
                playedAt: { type: "string", format: "date-time" },
                results: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      userId: { type: "string" },
                      wind: {
                        type: "string",
                        enum: ["east", "south", "west", "north"],
                      },
                      rawScore: { type: "number" },
                    },
                    required: ["userId", "wind", "rawScore"],
                  },
                },
                chomboEvents: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ChomboEvent" },
                },
                offTableKyotakuCount: { type: "integer", minimum: 0 },
              },
            }),
          },
          responses: {
            "200": {
              description: "match",
              content: jsonContent(
                dataResponse({ $ref: "#/components/schemas/Match" }),
              ),
            },
          },
        },
        delete: {
          tags: ["Matches"],
          summary: "delete match",
          parameters: [
            {
              in: "path",
              name: "leagueId",
              required: true,
              schema: { type: "string" },
            },
            {
              in: "path",
              name: "seasonId",
              required: true,
              schema: { type: "string" },
            },
            {
              in: "path",
              name: "sessionId",
              required: true,
              schema: { type: "string" },
            },
            {
              in: "path",
              name: "matchId",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "204": {
              description: "deleted",
            },
          },
        },
      },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "jongbo_session",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          username: { type: "string" },
          email: { type: "string" },
          name: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      JoiningSeason: {
        type: "object",
        properties: {
          leagueId: { type: "string" },
          leagueName: { type: "string" },
          seasonId: { type: "string" },
          seasonName: { type: "string" },
        },
      },
      UserStats: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          userName: { type: "string" },
          scopeType: { type: "string" },
          leagueId: { type: "string", nullable: true },
          seasonId: { type: "string", nullable: true },
          leagueName: { type: "string", nullable: true },
          seasonName: { type: "string", nullable: true },
          totalPoints: { type: "number" },
          totalMatchCount: { type: "number" },
          averageRank: { type: "number" },
          currentRank: { type: "number", nullable: true },
          firstCount: { type: "number" },
          secondCount: { type: "number" },
          thirdCount: { type: "number" },
          fourthCount: { type: "number", nullable: true },
          firstRate: { type: "number" },
          secondRate: { type: "number" },
          thirdRate: { type: "number" },
          fourthRate: { type: "number", nullable: true },
          highestScore: { type: "number", nullable: true },
          lowestScore: { type: "number", nullable: true },
          averageScore: { type: "number", nullable: true },
          winStreak: { type: "number", nullable: true },
          loseStreak: { type: "number", nullable: true },
          chomboCount: { type: "integer", minimum: 0 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      LeagueMember: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          userName: { type: "string" },
        },
      },
      LeagueSummary: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          memberCount: { type: "number" },
          totalMatchCount: { type: "number" },
          activeSeason: { type: "object", nullable: true },
          myStanding: { type: "object", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      LeagueDetail: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          rule: { $ref: "#/components/schemas/LeagueRule" },
          memberCount: { type: "number" },
          totalMatchCount: { type: "number" },
          activeSeason: { type: "object", nullable: true },
          members: {
            type: "array",
            items: { $ref: "#/components/schemas/LeagueMember" },
          },
          leagueRecords: { type: "object", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      SeasonMember: {
        type: "object",
        properties: {
          userId: { type: "string" },
          userName: { type: "string" },
        },
      },
      SeasonSummary: {
        type: "object",
        properties: {
          id: { type: "string" },
          leagueId: { type: "string" },
          name: { type: "string" },
          status: { type: "string", enum: ["active", "archived"] },
          memberCount: { type: "number" },
          totalMatchCount: { type: "number" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      SeasonDetail: {
        type: "object",
        properties: {
          id: { type: "string" },
          leagueId: { type: "string" },
          name: { type: "string" },
          status: { type: "string" },
          memberCount: { type: "number" },
          totalMatchCount: { type: "number" },
          members: {
            type: "array",
            items: { $ref: "#/components/schemas/SeasonMember" },
          },
          standings: { type: "array", items: { type: "object" } },
          pointProgressions: { type: "array", items: { type: "object" } },
          seasonRecords: { type: "object", nullable: true },
          latestPlayedAt: {
            type: "string",
            format: "date-time",
            nullable: true,
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Session: {
        type: "object",
        properties: {
          id: { type: "string" },
          leagueId: { type: "string" },
          seasonId: { type: "string" },
          startedAt: { type: "string", format: "date-time" },
          endedAt: { type: "string", format: "date-time", nullable: true },
          members: {
            type: "array",
            items: { $ref: "#/components/schemas/SeasonMember" },
          },
          memberCount: { type: "number" },
          totalMatchCount: { type: "number" },
          tableLabel: { type: "string", nullable: true },
          createdBy: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Match: {
        type: "object",
        properties: {
          id: { type: "string" },
          leagueId: { type: "string" },
          seasonId: { type: "string" },
          sessionId: { type: "string" },
          matchIndex: { type: "number" },
          playedAt: { type: "string", format: "date-time" },
          results: { type: "array", items: { type: "object" } },
          chomboEvents: {
            type: "array",
            items: { $ref: "#/components/schemas/ChomboEvent" },
          },
          offTableKyotakuCount: { type: "integer", minimum: 0 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["chomboEvents", "offTableKyotakuCount"],
      },
      ChomboEvent: {
        type: "object",
        properties: { offenderUserId: { type: "string" } },
        required: ["offenderUserId"],
      },
      CreateLeagueInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          rule: { $ref: "#/components/schemas/LeagueRuleInput" },
          memberUserIds: { type: "array", items: { type: "string" } },
        },
        required: ["name", "rule", "memberUserIds"],
      },
      LeagueRule: {
        oneOf: [
          { $ref: "#/components/schemas/FixedSanmaLeagueRule" },
          { $ref: "#/components/schemas/FixedYonmaLeagueRule" },
          { $ref: "#/components/schemas/FloatingCountYonmaLeagueRule" },
        ],
      },
      LeagueRuleInput: {
        description:
          "Accepts fixed or floatingCount rules, with or without chomboPenaltyPoints, allowOffTableKyotaku, and rotateSeatOrder. Omitted fields default to 0 and false; legacy fixed rules without uma.mode are normalized to mode=fixed.",
        oneOf: [
          { $ref: "#/components/schemas/FixedSanmaLeagueRuleInput" },
          { $ref: "#/components/schemas/FixedYonmaLeagueRuleInput" },
          { $ref: "#/components/schemas/FloatingCountYonmaLeagueRuleInput" },
          { $ref: "#/components/schemas/LegacyFixedSanmaLeagueRule" },
          { $ref: "#/components/schemas/LegacyFixedYonmaLeagueRule" },
        ],
      },
      FixedSanmaLeagueRuleInput: {
        type: "object",
        properties: {
          gameType: { type: "string", enum: ["sanma"] },
          oka: { $ref: "#/components/schemas/LeagueOka" },
          uma: {
            allOf: [
              { $ref: "#/components/schemas/UmaRule" },
              { $ref: "#/components/schemas/FixedSanmaUma" },
            ],
          },
          chomboPenaltyPoints: { type: "integer", minimum: 0, default: 0 },
          allowOffTableKyotaku: { type: "boolean", default: false },
          rotateSeatOrder: { type: "boolean", default: false },
        },
        required: ["gameType", "oka", "uma"],
      },
      FixedYonmaLeagueRuleInput: {
        type: "object",
        properties: {
          gameType: { type: "string", enum: ["yonma"] },
          oka: { $ref: "#/components/schemas/LeagueOka" },
          uma: {
            allOf: [
              { $ref: "#/components/schemas/UmaRule" },
              { $ref: "#/components/schemas/FixedYonmaUma" },
            ],
          },
          chomboPenaltyPoints: { type: "integer", minimum: 0, default: 0 },
          allowOffTableKyotaku: { type: "boolean", default: false },
          rotateSeatOrder: { type: "boolean", default: false },
        },
        required: ["gameType", "oka", "uma"],
      },
      FloatingCountYonmaLeagueRuleInput: {
        type: "object",
        properties: {
          gameType: { type: "string", enum: ["yonma"] },
          oka: { $ref: "#/components/schemas/LeagueOka" },
          uma: {
            allOf: [
              { $ref: "#/components/schemas/UmaRule" },
              { $ref: "#/components/schemas/FloatingCountUma" },
            ],
          },
          chomboPenaltyPoints: { type: "integer", minimum: 0, default: 0 },
          allowOffTableKyotaku: { type: "boolean", default: false },
          rotateSeatOrder: { type: "boolean", default: false },
        },
        required: ["gameType", "oka", "uma"],
      },
      UmaRule: {
        description:
          "Canonical uma mode union. The enclosing LeagueRule constrains fixed uma to the gameType-specific shape.",
        oneOf: [
          { $ref: "#/components/schemas/FixedUma" },
          { $ref: "#/components/schemas/FloatingCountUma" },
        ],
        discriminator: {
          propertyName: "mode",
          mapping: {
            fixed: "#/components/schemas/FixedUma",
            floatingCount: "#/components/schemas/FloatingCountUma",
          },
        },
      },
      FixedSanmaLeagueRule: {
        type: "object",
        properties: {
          gameType: { type: "string", enum: ["sanma"] },
          oka: { $ref: "#/components/schemas/LeagueOka" },
          uma: {
            allOf: [
              { $ref: "#/components/schemas/UmaRule" },
              { $ref: "#/components/schemas/FixedSanmaUma" },
            ],
          },
          chomboPenaltyPoints: { type: "integer", minimum: 0 },
          allowOffTableKyotaku: { type: "boolean" },
          rotateSeatOrder: { type: "boolean" },
        },
        required: [
          "gameType",
          "oka",
          "uma",
          "chomboPenaltyPoints",
          "allowOffTableKyotaku",
          "rotateSeatOrder",
        ],
      },
      FixedYonmaLeagueRule: {
        type: "object",
        properties: {
          gameType: { type: "string", enum: ["yonma"] },
          oka: { $ref: "#/components/schemas/LeagueOka" },
          uma: {
            allOf: [
              { $ref: "#/components/schemas/UmaRule" },
              { $ref: "#/components/schemas/FixedYonmaUma" },
            ],
          },
          chomboPenaltyPoints: { type: "integer", minimum: 0 },
          allowOffTableKyotaku: { type: "boolean" },
          rotateSeatOrder: { type: "boolean" },
        },
        required: [
          "gameType",
          "oka",
          "uma",
          "chomboPenaltyPoints",
          "allowOffTableKyotaku",
          "rotateSeatOrder",
        ],
      },
      FloatingCountYonmaLeagueRule: {
        type: "object",
        description:
          "A yonma rule whose rank points are selected by the number of raw scores at or above returnPoints.",
        properties: {
          gameType: { type: "string", enum: ["yonma"] },
          oka: { $ref: "#/components/schemas/LeagueOka" },
          uma: {
            allOf: [
              { $ref: "#/components/schemas/UmaRule" },
              { $ref: "#/components/schemas/FloatingCountUma" },
            ],
          },
          chomboPenaltyPoints: { type: "integer", minimum: 0 },
          allowOffTableKyotaku: { type: "boolean" },
          rotateSeatOrder: { type: "boolean" },
        },
        required: [
          "gameType",
          "oka",
          "uma",
          "chomboPenaltyPoints",
          "allowOffTableKyotaku",
          "rotateSeatOrder",
        ],
      },
      LeagueOka: {
        type: "object",
        properties: {
          startingPoints: { type: "integer" },
          returnPoints: { type: "integer" },
        },
        required: ["startingPoints", "returnPoints"],
      },
      FixedSanmaUma: {
        type: "object",
        properties: {
          mode: { type: "string", enum: ["fixed"] },
          first: { type: "integer" },
          second: { type: "integer" },
          third: { type: "integer" },
          fourth: { enum: [null] },
        },
        required: ["mode", "first", "second", "third", "fourth"],
      },
      FixedYonmaUma: {
        type: "object",
        properties: {
          mode: { type: "string", enum: ["fixed"] },
          first: { type: "integer" },
          second: { type: "integer" },
          third: { type: "integer" },
          fourth: { type: "integer" },
        },
        required: ["mode", "first", "second", "third", "fourth"],
      },
      FixedUma: {
        type: "object",
        properties: {
          mode: { type: "string", enum: ["fixed"] },
          first: { type: "integer" },
          second: { type: "integer" },
          third: { type: "integer" },
          fourth: { type: "integer", nullable: true },
        },
        required: ["mode", "first", "second", "third", "fourth"],
      },
      FloatingCountUma: {
        type: "object",
        description:
          "Requires all floating counts from 0 to 4 and integer first-through-fourth rank points in each row. Each row must total zero.",
        properties: {
          mode: { type: "string", enum: ["floatingCount"] },
          pointsByFloatingCount: {
            $ref: "#/components/schemas/FloatingCountRankPointsTable",
          },
        },
        required: ["mode", "pointsByFloatingCount"],
      },
      FloatingCountRankPointsTable: {
        type: "object",
        properties: {
          "0": { $ref: "#/components/schemas/RankPoints" },
          "1": { $ref: "#/components/schemas/RankPoints" },
          "2": { $ref: "#/components/schemas/RankPoints" },
          "3": { $ref: "#/components/schemas/RankPoints" },
          "4": { $ref: "#/components/schemas/RankPoints" },
        },
        required: ["0", "1", "2", "3", "4"],
      },
      RankPoints: {
        type: "object",
        properties: {
          first: { type: "integer" },
          second: { type: "integer" },
          third: { type: "integer" },
          fourth: { type: "integer" },
        },
        required: ["first", "second", "third", "fourth"],
      },
      LegacyFixedSanmaLeagueRule: {
        type: "object",
        properties: {
          gameType: { type: "string", enum: ["sanma"] },
          oka: { $ref: "#/components/schemas/LeagueOka" },
          uma: { $ref: "#/components/schemas/LegacyFixedSanmaUma" },
          rotateSeatOrder: { type: "boolean", default: false },
        },
        required: ["gameType", "oka", "uma"],
      },
      LegacyFixedYonmaLeagueRule: {
        type: "object",
        properties: {
          gameType: { type: "string", enum: ["yonma"] },
          oka: { $ref: "#/components/schemas/LeagueOka" },
          uma: { $ref: "#/components/schemas/LegacyFixedYonmaUma" },
          rotateSeatOrder: { type: "boolean", default: false },
        },
        required: ["gameType", "oka", "uma"],
      },
      LegacyFixedSanmaUma: {
        type: "object",
        properties: {
          first: { type: "integer" },
          second: { type: "integer" },
          third: { type: "integer" },
          fourth: { enum: [null] },
        },
        required: ["first", "second", "third", "fourth"],
        additionalProperties: false,
      },
      LegacyFixedYonmaUma: {
        type: "object",
        properties: {
          first: { type: "integer" },
          second: { type: "integer" },
          third: { type: "integer" },
          fourth: { type: "integer" },
        },
        required: ["first", "second", "third", "fourth"],
        additionalProperties: false,
      },
      CreateSeasonInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          memberUserIds: { type: "array", items: { type: "string" } },
          status: { type: "string", enum: ["active", "archived"] },
        },
        required: ["name", "memberUserIds"],
      },
      CreateSessionInput: {
        type: "object",
        properties: {
          startedAt: { type: "string", format: "date-time" },
          endedAt: { type: "string", format: "date-time", nullable: true },
          memberUserIds: { type: "array", items: { type: "string" } },
          tableLabel: { type: "string", nullable: true },
        },
        required: ["startedAt", "memberUserIds"],
      },
      CreateMatchInput: {
        type: "object",
        properties: {
          playedAt: { type: "string", format: "date-time" },
          results: {
            type: "array",
            items: {
              type: "object",
              properties: {
                userId: { type: "string" },
                wind: {
                  type: "string",
                  enum: ["east", "south", "west", "north"],
                },
                rawScore: { type: "number" },
              },
              required: ["userId", "wind", "rawScore"],
            },
          },
          chomboEvents: {
            type: "array",
            items: { $ref: "#/components/schemas/ChomboEvent" },
          },
          offTableKyotakuCount: { type: "integer", minimum: 0 },
        },
        required: ["playedAt", "results"],
      },
      ...statisticsSchemas,
    },
  },
} as const;
