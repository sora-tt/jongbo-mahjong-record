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
    { name: "Rules" },
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
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            properties: {
              idToken: { type: "string" },
            },
            required: ["idToken"],
          }),
        },
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
    "/api/rules": {
      get: {
        tags: ["Rules"],
        summary: "list rules",
        responses: {
          "200": {
            description: "rules",
            content: jsonContent(
              dataResponse({
                type: "array",
                items: { $ref: "#/components/schemas/Rule" },
              }),
            ),
          },
        },
      },
      post: {
        tags: ["Rules"],
        summary: "create rule",
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              gameType: { type: "string", enum: ["sanma", "yonma"] },
              uma: { type: "object" },
              oka: { type: "object" },
              scoreCalculation: {
                type: "string",
                enum: ["decimal", "fiveDropSixUp", "round", "floor", "ceil"],
              },
            },
            required: ["name", "gameType", "uma", "oka", "scoreCalculation"],
          }),
        },
        responses: {
          "201": {
            description: "rule",
            content: jsonContent(
              dataResponse({ $ref: "#/components/schemas/Rule" }),
            ),
          },
        },
      },
    },
    "/api/rules/{ruleId}": {
      get: {
        tags: ["Rules"],
        summary: "get rule",
        parameters: [
          {
            in: "path",
            name: "ruleId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "rule",
            content: jsonContent(
              dataResponse({ $ref: "#/components/schemas/Rule" }),
            ),
          },
          "404": {
            description: "not found",
            content: jsonContent(errorResponse),
          },
        },
      },
      patch: {
        tags: ["Rules"],
        summary: "update rule",
        parameters: [
          {
            in: "path",
            name: "ruleId",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: jsonContent({ type: "object" }),
        },
        responses: {
          "200": {
            description: "rule",
            content: jsonContent(
              dataResponse({ $ref: "#/components/schemas/Rule" }),
            ),
          },
        },
      },
      delete: {
        tags: ["Rules"],
        summary: "delete rule",
        parameters: [
          {
            in: "path",
            name: "ruleId",
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
          content: jsonContent({ type: "object" }),
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
          content: jsonContent({ type: "object" }),
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
            content: jsonContent({ type: "object" }),
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
      Rule: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          gameType: { type: "string", enum: ["sanma", "yonma"] },
          uma: { type: "object" },
          oka: { type: "object" },
          scoreCalculation: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
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
          rule: { type: "object" },
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
          rule: { type: "object" },
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
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateLeagueInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          ruleId: { type: "string" },
          memberUserIds: { type: "array", items: { type: "string" } },
        },
        required: ["name", "ruleId", "memberUserIds"],
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
          createdBy: { type: "string" },
        },
        required: ["startedAt", "memberUserIds", "createdBy"],
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
                rank: { type: "number" },
                rawScore: { type: "number" },
              },
              required: ["userId", "wind", "rank", "rawScore"],
            },
          },
        },
        required: ["playedAt", "results"],
      },
    },
  },
} as const;
