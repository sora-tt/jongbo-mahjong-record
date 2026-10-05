import assert from "node:assert/strict";
import test from "node:test";
import { openApiDocument } from "@/presentation/openapi.js";

type OpenApiOperation = {
  parameters: Array<{
    in: string;
    name: string;
    required?: boolean;
    description?: string;
    schema: { enum?: Array<string | number>; type?: string };
  }>;
  responses: Record<
    string,
    {
      content?: {
        "application/json"?: {
          schema?: {
            properties?: { data?: { $ref?: string } };
            $ref?: string;
          };
        };
      };
    }
  >;
};

type OpenApiStatisticsDocument = {
  paths: Record<string, { get: OpenApiOperation }>;
  components: { schemas: Record<string, unknown> };
};

type OpenApiSchema = {
  type?: string;
  nullable?: boolean;
  enum?: unknown[];
  properties?: Record<string, OpenApiSchema>;
  allOf?: Array<{ $ref?: string }>;
  items?: OpenApiSchema;
  maxItems?: number;
  discriminator?: {
    propertyName?: string;
    mapping?: Record<string, string>;
  };
};

const document = openApiDocument as unknown as OpenApiStatisticsDocument;
const endpointPaths = [
  "/api/users/{userId}/statistics",
  "/api/users/{userId}/statistics/analysis",
  "/api/users/{userId}/statistics/matches",
] as const;
const expectedErrorStatuses = ["400", "401", "403", "404", "500"];

const parameterByName = (operation: OpenApiOperation, name: string) =>
  operation.parameters.find((parameter) => parameter.name === name);

test("statistics OpenAPI operations expose target path, query parameters, and response statuses", () => {
  const expectedQueries = [
    ["scopeType", "leagueId", "seasonId", "from", "to", "gameType"],
    [
      "scopeType",
      "leagueId",
      "seasonId",
      "from",
      "to",
      "gameType",
      "dimension",
      "groupBy",
      "windowSize",
      "limit",
      "cursor",
    ],
    [
      "scopeType",
      "leagueId",
      "seasonId",
      "from",
      "to",
      "gameType",
      "limit",
      "cursor",
    ],
  ];

  endpointPaths.forEach((path, index) => {
    const operation = document.paths[path]?.get;
    assert.ok(operation, `${path} should be documented`);

    const userId = parameterByName(operation, "userId");
    assert.equal(userId?.in, "path");
    assert.equal(userId?.required, true);

    for (const queryName of expectedQueries[index] ?? []) {
      assert.equal(
        parameterByName(operation, queryName)?.in,
        "query",
        queryName,
      );
    }
    assert.equal(parameterByName(operation, "scopeType")?.required, true);

    for (const status of ["200", ...expectedErrorStatuses]) {
      assert.ok(
        operation.responses[status],
        `${path} should document ${status}`,
      );
    }

    assert.ok(
      operation.responses["200"]?.content?.["application/json"]?.schema
        ?.properties?.data?.$ref,
      `${path} should use the standard data envelope and a response component`,
    );
  });

  assert.deepEqual(
    parameterByName(document.paths[endpointPaths[1]]!.get, "dimension")?.schema
      .enum,
    ["period", "weekday", "timeOfDay", "seat", "opponent", "session"],
  );
  assert.deepEqual(
    parameterByName(document.paths[endpointPaths[1]]!.get, "windowSize")?.schema
      .enum,
    [10, 20, 50],
  );
  assert.deepEqual(
    parameterByName(document.paths[endpointPaths[2]]!.get, "limit")?.schema
      .type,
    "integer",
  );
  assert.match(
    parameterByName(document.paths[endpointPaths[0]]!.get, "leagueId")
      ?.description ?? "",
    /overall.*指定不可/,
  );
  assert.match(
    parameterByName(document.paths[endpointPaths[0]]!.get, "seasonId")
      ?.description ?? "",
    /overall.*league.*指定不可/,
  );
  assert.match(
    parameterByName(document.paths[endpointPaths[0]]!.get, "seasonId")
      ?.description ?? "",
    /season.*必須/,
  );
});

test("statistics OpenAPI components describe result status, dimensions, and opaque cursors", () => {
  const schemas = document.components.schemas;
  const statisticsSchemas = [
    "StatisticsScope",
    "StatisticsSummaryResult",
    "StatisticsAnalysisResult",
    "StatisticsBreakdown",
    "StatisticsMatchPageResult",
    "StatisticsMatchItem",
    "StatisticsMatchReference",
  ];

  for (const name of statisticsSchemas) {
    assert.ok(schemas[name], `missing component schema ${name}`);
  }

  const statusValues = (resultName: string) => {
    const result = schemas[resultName] as {
      oneOf?: Array<{ $ref?: string }>;
    };
    assert.ok(Array.isArray(result.oneOf));
    return result.oneOf.flatMap((variant) => {
      const componentName = variant.$ref?.split("/").at(-1);
      const component = componentName ? schemas[componentName] : undefined;
      const status = component as
        | { properties?: { status?: { enum?: string[] } } }
        | undefined;
      return status?.properties?.status?.enum ?? [];
    });
  };

  assert.deepEqual(statusValues("StatisticsSummaryResult").sort(), [
    "empty",
    "ready",
    "uncomputed",
  ]);
  assert.deepEqual(statusValues("StatisticsAnalysisResult").sort(), [
    "empty",
    "ready",
    "uncomputed",
  ]);
  assert.deepEqual(statusValues("StatisticsMatchPageResult").sort(), [
    "empty",
    "ready",
    "uncomputed",
  ]);

  const breakdown = schemas.StatisticsBreakdown as {
    oneOf?: Array<{ $ref?: string }>;
  };
  assert.ok(Array.isArray(breakdown.oneOf));
  assert.deepEqual(
    breakdown.oneOf.flatMap((variant) => {
      const componentName = variant.$ref?.split("/").at(-1);
      const component = componentName ? schemas[componentName] : undefined;
      const dimension = component as
        | { properties?: { dimension?: { enum?: string[] } } }
        | undefined;
      return dimension?.properties?.dimension?.enum ?? [];
    }),
    ["period", "weekday", "timeOfDay", "seat", "opponent", "session"],
  );

  const historyReady = schemas.StatisticsMatchHistoryReady as {
    properties?: { nextCursor?: { type?: string; nullable?: boolean } };
  };
  assert.equal(historyReady.properties?.nextCursor?.type, "string");
  assert.equal(historyReady.properties?.nextCursor?.nullable, true);
});

test("statistics OpenAPI uses valid OpenAPI 3.0 nullable schemas", () => {
  const schemas = document.components.schemas as Record<string, OpenApiSchema>;
  const summary = schemas.PersonalStatisticsSummary;
  const properties = summary.properties;
  assert.ok(properties);
  const records = properties.records?.properties;
  assert.ok(records);
  assert.deepEqual(properties.scoreByGameType, {
    type: "array",
    items: { $ref: "#/components/schemas/StatisticsScoreByGameType" },
  });
  assert.deepEqual(
    (schemas.StatisticsScoreByGameType?.properties ?? {}).rawScore,
    { $ref: "#/components/schemas/StatisticsNumericSummary" },
  );
  assert.deepEqual(
    (schemas.StatisticsScoreByGameType?.properties ?? {}).finalPoint,
    { $ref: "#/components/schemas/StatisticsFinalPointSummary" },
  );

  for (const property of [
    "highestRawScore",
    "lowestRawScore",
    "highestFinalPoint",
    "lowestFinalPoint",
  ]) {
    assert.deepEqual(records[property], {
      $ref: "#/components/schemas/StatisticsRecord",
    });
  }
  assert.deepEqual(properties.currentStanding, {
    $ref: "#/components/schemas/StatisticsCurrentStanding",
  });
  for (const component of ["StatisticsRecord", "StatisticsCurrentStanding"]) {
    assert.equal(schemas[component]?.type, "object");
    assert.equal(schemas[component]?.nullable, true);
  }

  const nullStringSchema = {
    type: "string",
    nullable: true,
    enum: [null],
  };
  for (const [component, property] of [
    ["StatisticsSummaryUncomputed", "generatedAt"],
    ["StatisticsAnalysisUncomputed", "generatedAt"],
    ["StatisticsMatchHistoryUncomputed", "generatedAt"],
    ["StatisticsFixedBreakdown", "nextCursor"],
    ["StatisticsMatchHistoryEmpty", "nextCursor"],
    ["StatisticsMatchHistoryUncomputed", "nextCursor"],
  ]) {
    assert.deepEqual(
      schemas[component]?.properties?.[property],
      nullStringSchema,
    );
  }

  for (const component of [
    "StatisticsMatchHistoryEmpty",
    "StatisticsMatchHistoryUncomputed",
  ]) {
    assert.deepEqual(schemas[component]?.properties?.items, {
      type: "array",
      items: { $ref: "#/components/schemas/StatisticsMatchItem" },
      maxItems: 0,
    });
  }
});

test("statistics OpenAPI discriminators explicitly map every value to its schema", () => {
  const schemas = document.components.schemas as Record<string, OpenApiSchema>;
  const expectedMappings = {
    StatisticsScope: {
      overall: "OverallStatisticsScope",
      league: "LeagueStatisticsScope",
      season: "SeasonStatisticsScope",
    },
    StatisticsSummaryResult: {
      ready: "PersonalStatisticsSummary",
      empty: "PersonalStatisticsSummary",
      uncomputed: "StatisticsSummaryUncomputed",
    },
    StatisticsAnalysisResult: {
      ready: "StatisticsAnalysisReadyOrEmpty",
      empty: "StatisticsAnalysisReadyOrEmpty",
      uncomputed: "StatisticsAnalysisUncomputed",
    },
    StatisticsBreakdown: {
      period: "StatisticsFixedBreakdown",
      weekday: "StatisticsFixedBreakdown",
      timeOfDay: "StatisticsFixedBreakdown",
      seat: "StatisticsFixedBreakdown",
      opponent: "StatisticsOpponentBreakdown",
      session: "StatisticsSessionBreakdown",
    },
    StatisticsMatchPageResult: {
      ready: "StatisticsMatchHistoryReady",
      empty: "StatisticsMatchHistoryEmpty",
      uncomputed: "StatisticsMatchHistoryUncomputed",
    },
  };

  for (const [component, mapping] of Object.entries(expectedMappings)) {
    assert.deepEqual(schemas[component]?.discriminator, {
      propertyName:
        component === "StatisticsScope"
          ? "scopeType"
          : component === "StatisticsBreakdown"
            ? "dimension"
            : "status",
      mapping: Object.fromEntries(
        Object.entries(mapping).map(([value, target]) => [
          value,
          `#/components/schemas/${target}`,
        ]),
      ),
    });
  }
});
