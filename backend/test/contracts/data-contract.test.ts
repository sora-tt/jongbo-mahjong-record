import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { Timestamp } from "firebase-admin/firestore";
import type { LeagueRule } from "@/domain/league/types.js";
import {
  asIsoDateString,
  asOpaqueId,
  type IsoDateString,
  type OpaqueId,
} from "@/domain/shared/types.js";
import { toIsoString, toTimestamp } from "@/infrastructure/firestore/utils.js";

test("canonical boundary types preserve opaque ids and ISO dates", () => {
  const userId: OpaqueId = asOpaqueId("user-1");
  const createdAt: IsoDateString = asIsoDateString("2026-09-25T00:00:00.000Z");

  assert.equal(userId, "user-1");
  assert.equal(createdAt, "2026-09-25T00:00:00.000Z");
});

test("Firestore timestamp conversion is explicit at the persistence boundary", () => {
  const timestamp = Timestamp.fromDate(new Date("2026-09-25T00:00:00.000Z"));

  assert.equal(toIsoString(timestamp), "2026-09-25T00:00:00.000Z");
  assert.equal(
    toIsoString(toTimestamp("2026-09-25T00:00:00.000Z")),
    "2026-09-25T00:00:00.000Z",
  );
  assert.equal(toTimestamp(null), null);
});

test("league rule is embedded and has only the canonical fields", () => {
  const rule = {
    gameType: "yonma",
    uma: { first: 20, second: 10, third: -10, fourth: -20 },
    oka: { startingPoints: 25_000, returnPoints: 30_000 },
  } satisfies LeagueRule;

  assert.equal(
    rule.uma.first + rule.uma.second + rule.uma.third + rule.uma.fourth,
    0,
  );
  assert.deepEqual(Object.keys(rule).sort(), ["gameType", "oka", "uma"]);
});

test("Firestore schema documents bounded personal statistics and match projections", () => {
  const schema = readFileSync(
    resolve(process.cwd(), "docs/firestore.yaml"),
    "utf8",
  );
  const projectionSchema = schema
    .split("\nuser_match_statistics:\n")[1]
    ?.split("\nuser_stats:\n")[0];
  const userStatsSchema = schema.split("\nuser_stats:\n")[1];

  assert.ok(projectionSchema, "user_match_statistics schema must be defined");
  assert.ok(userStatsSchema, "user_stats schema must be defined");

  for (const field of [
    "id",
    "user_id",
    "user_name",
    "league_id",
    "league_name",
    "season_id",
    "season_name",
    "session_id",
    "session_label",
    "match_id",
    "match_index",
    "played_at",
    "game_type",
    "player_count",
    "wind",
    "rank",
    "raw_score",
    "final_point",
    "chombo_count",
    "opponents",
    "updated_at",
  ]) {
    assert.match(projectionSchema, new RegExp(`^    ${field}:`, "m"));
  }

  for (const field of [
    "personal_statistics_version",
    "personal_statistics",
    "all",
    "byGameType",
    "totals",
    "rawScore",
    "finalPoint",
    "scoreByRank",
    "records",
    "streaks",
    "recentResults",
    "currentStanding",
  ]) {
    assert.match(userStatsSchema, new RegExp(`^\\s+${field}:`, "m"));
  }

  const gameTypeSummary = userStatsSchema
    .split("\n              summary:\n")[1]
    ?.split("\n    created_at:")[0];
  assert.ok(gameTypeSummary, "per-game-type snapshot summary must be defined");
  assert.equal(
    userStatsSchema.match(/^\s+opponents:$/gm)?.length,
    8,
    "all and per-game-type record holders must include bounded opponents",
  );

  for (const record of [
    "highestRawScore",
    "lowestRawScore",
    "highestFinalPoint",
    "lowestFinalPoint",
  ]) {
    assert.match(
      gameTypeSummary,
      new RegExp(
        `^ +${record}:\\n +type: object\\n +nullable: true\\n +fields:\\n +value: number\\n +match:\\n +type: object\\n +fields:\\n +matchId: string\\n +leagueId: string`,
        "m",
      ),
    );
    assert.match(
      gameTypeSummary,
      new RegExp(
        `^ +${record}:[\\s\\S]*?playedAt: string\\n +opponents:\\n +type: array\\n +maxItems: 3\\n +items:\\n +type: object\\n +fields:\\n +userId: string\\n +userName: string\\n +rank: number\\n +finalPoint: number`,
        "m",
      ),
    );
  }
  assert.match(
    gameTypeSummary,
    /^ +streaks:\n +type: array\n +items:\n +type: object\n +fields:\n +type:\n +type: string\n +enum: \[top, last, topTwo, positive, negative\]\n +currentCount: number\n +longestCount: number/m,
  );
  assert.match(
    gameTypeSummary,
    /^ +recentResults:\n +type: array\n +items:\n +type: object\n +fields:\n +windowSize:\n +type: number\n +enum: \[10, 20, 50\][\s\S]*?byGameType:\n +type: array\n +items:\n +type: object\n +fields:\n +gameType:/m,
  );
  assert.match(
    gameTypeSummary,
    /^ +currentStanding:\n +type: object\n +nullable: true\n +fields:\n +rank: number[\s\S]*?source:\n +type: string\n +enum: \[season, activeSeason\]/m,
  );
  assert.match(gameTypeSummary, /^ +playedAt: string$/m);
});

test("Firestore indexes cover scope, game type, and the four-key history order", () => {
  const indexDocument = JSON.parse(
    readFileSync(resolve(process.cwd(), "firestore.indexes.json"), "utf8"),
  ) as {
    indexes: Array<{
      collectionGroup: string;
      queryScope: string;
      fields: Array<{ fieldPath: string; order: string }>;
    }>;
  };
  const firebaseConfig = JSON.parse(
    readFileSync(resolve(process.cwd(), "firebase.json"), "utf8"),
  ) as {
    firestore: { indexes: string };
    emulators: { firestore: { port: number } };
  };
  const cursorFields = [
    { fieldPath: "played_at", order: "DESCENDING" },
    { fieldPath: "session_id", order: "DESCENDING" },
    { fieldPath: "match_index", order: "DESCENDING" },
    { fieldPath: "match_id", order: "DESCENDING" },
  ];
  const scopePrefixes = [
    [{ fieldPath: "user_id", order: "ASCENDING" }],
    [
      { fieldPath: "user_id", order: "ASCENDING" },
      { fieldPath: "league_id", order: "ASCENDING" },
    ],
    [
      { fieldPath: "user_id", order: "ASCENDING" },
      { fieldPath: "league_id", order: "ASCENDING" },
      { fieldPath: "season_id", order: "ASCENDING" },
    ],
  ];

  assert.equal(firebaseConfig.firestore.indexes, "firestore.indexes.json");
  assert.ok(firebaseConfig.emulators.firestore.port > 0);

  for (const scopePrefix of scopePrefixes) {
    for (const gameTypeField of [
      [],
      [{ fieldPath: "game_type", order: "ASCENDING" }],
    ]) {
      const expectedFields = [
        ...scopePrefix,
        ...gameTypeField,
        ...cursorFields,
      ];
      assert.ok(
        indexDocument.indexes.some(
          (index) =>
            index.collectionGroup === "user_match_statistics" &&
            index.queryScope === "COLLECTION" &&
            JSON.stringify(index.fields) === JSON.stringify(expectedFields),
        ),
        `missing index for ${expectedFields.map(({ fieldPath }) => fieldPath).join(", ")}`,
      );
    }
  }
});
