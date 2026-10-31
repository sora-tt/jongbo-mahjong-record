import assert from "node:assert/strict";
import test from "node:test";
import {
  MatchService,
  validateMatchParticipants,
} from "@/application/services/matchService.js";
import type { StatsRebuilder } from "@/application/services/statsRebuilder.js";
import type { LeagueRepository } from "@/domain/league/repository.js";
import type { LeagueRule } from "@/domain/league/types.js";
import type { Match, YakumanEventInput } from "@/domain/match/types.js";
import type { MatchRepository } from "@/domain/match/repository.js";
import type { SeasonRepository } from "@/domain/season/repository.js";
import type { SessionRepository } from "@/domain/session/repository.js";
import { asIsoDateString, asOpaqueId } from "@/domain/shared/types.js";

const members = [
  { userId: "u1", userName: "A" },
  { userId: "u2", userName: "B" },
  { userId: "u3", userName: "C" },
  { userId: "u4", userName: "D" },
];

test("accepts exactly the fixed Session member set", () => {
  assert.doesNotThrow(() =>
    validateMatchParticipants(
      members.map(({ userId }) => ({ userId, wind: "east", rawScore: 25000 })),
      members,
    ),
  );
});

test("rejects a Match participant outside the fixed Session member set", () => {
  assert.throws(
    () =>
      validateMatchParticipants(
        [
          { userId: "u1" },
          { userId: "u2" },
          { userId: "u3" },
          { userId: "other" },
        ],
        members,
      ),
    /match participants must match session members/,
  );
});

const sessionMembers = members.map(({ userId, userName }) => ({
  userId: asOpaqueId(userId),
  userName,
}));

const rule = {
  gameType: "yonma",
  uma: { mode: "fixed", first: 20, second: 10, third: -10, fourth: -20 },
  oka: { startingPoints: 25000, returnPoints: 30000 },
  chomboPenaltyPoints: 2000,
  allowOffTableKyotaku: false,
  rotateSeatOrder: false,
} satisfies LeagueRule;

const matchResults: Match["results"] = [
  {
    userId: asOpaqueId("u1"),
    userName: "A",
    wind: "east",
    rank: 1,
    rawScore: 40000,
    point: 45,
  },
  {
    userId: asOpaqueId("u2"),
    userName: "B",
    wind: "south",
    rank: 2,
    rawScore: 30000,
    point: 15,
  },
  {
    userId: asOpaqueId("u3"),
    userName: "C",
    wind: "west",
    rank: 3,
    rawScore: 20000,
    point: -15,
  },
  {
    userId: asOpaqueId("u4"),
    userName: "D",
    wind: "north",
    rank: 4,
    rawScore: 10000,
    point: -45,
  },
];

const existingMatch: Match = {
  id: asOpaqueId("match-1"),
  leagueId: asOpaqueId("league-1"),
  seasonId: asOpaqueId("season-1"),
  sessionId: asOpaqueId("session-1"),
  matchIndex: 1,
  playedAt: asIsoDateString("2026-01-01T00:00:00.000Z"),
  results: matchResults,
  chomboEvents: [],
  yakumanEvents: [],
  offTableKyotakuCount: 0,
  createdAt: asIsoDateString("2026-01-01T00:00:00.000Z"),
  updatedAt: asIsoDateString("2026-01-01T00:00:00.000Z"),
};

const createResults: Array<{
  userId: string;
  wind: "east" | "south" | "west" | "north";
  rawScore: number;
}> = matchResults.map(({ userId, wind, rawScore }) => ({
  userId,
  wind,
  rawScore,
}));

const makeCreateInput = (yakumanEvents?: YakumanEventInput[]) => ({
  playedAt: "2026-01-01T00:00:00.000Z",
  results: createResults,
  ...(yakumanEvents === undefined ? {} : { yakumanEvents }),
});

const makeServiceFixture = () => {
  let createCallCount = 0;
  let updateInput: Parameters<MatchRepository["update"]>[0] | undefined;
  let deleteCallCount = 0;
  let rebuildCallCount = 0;

  const leagueRepository = {
    getRule: async () => rule,
  } as unknown as LeagueRepository;
  const seasonRepository = {
    listMembers: async () => sessionMembers,
  } as unknown as SeasonRepository;
  const sessionRepository = {
    get: async () => ({ members: sessionMembers }),
  } as unknown as SessionRepository;
  const matchRepository = {
    get: async () => existingMatch,
    create: async () => {
      createCallCount += 1;
      return existingMatch;
    },
    update: async (input: Parameters<MatchRepository["update"]>[0]) => {
      updateInput = input;
      return {
        ...existingMatch,
        yakumanEvents: (input.yakumanEvents ?? existingMatch.yakumanEvents).map(
          ({ winnerUserId, kind }) => ({
            winnerUserId: asOpaqueId(winnerUserId),
            kind,
          }),
        ),
      };
    },
    delete: async () => {
      deleteCallCount += 1;
    },
  } as unknown as MatchRepository;
  const statsRebuilder = {
    rebuildSeason: async () => {
      rebuildCallCount += 1;
    },
  } as unknown as StatsRebuilder;

  return {
    service: new MatchService(
      leagueRepository,
      seasonRepository,
      sessionRepository,
      matchRepository,
      statsRebuilder,
    ),
    getCreateCallCount: () => createCallCount,
    getUpdateInput: () => updateInput,
    getDeleteCallCount: () => deleteCallCount,
    getRebuildCallCount: () => rebuildCallCount,
  };
};

test("rejects a yakuman winner outside fixed Session members on create", async () => {
  const fixture = makeServiceFixture();

  await assert.rejects(
    fixture.service.createMatch(
      "u1",
      "league-1",
      "season-1",
      "session-1",
      makeCreateInput([{ winnerUserId: "outside", kind: "daisangen" }]),
    ),
    /yakuman winner must belong to session/,
  );

  assert.equal(fixture.getCreateCallCount(), 0);
  assert.equal(fixture.getRebuildCallCount(), 0);
});

test("rejects a yakuman winner outside fixed Session members on update", async () => {
  const fixture = makeServiceFixture();

  await assert.rejects(
    fixture.service.updateMatch(
      "u1",
      "league-1",
      "season-1",
      "session-1",
      "match-1",
      { yakumanEvents: [{ winnerUserId: "outside", kind: "daisangen" }] },
    ),
    /yakuman winner must belong to session/,
  );

  assert.equal(fixture.getUpdateInput(), undefined);
  assert.equal(fixture.getRebuildCallCount(), 0);
});

test("yakuman-only updates preserve score results and rebuild statistics", async () => {
  const fixture = makeServiceFixture();
  const yakumanEvents = [
    { winnerUserId: "u1", kind: "daisangen" as const },
    { winnerUserId: "u1", kind: "tsuuiisou" as const },
  ];

  const updated = await fixture.service.updateMatch(
    "u1",
    "league-1",
    "season-1",
    "session-1",
    "match-1",
    { yakumanEvents },
  );

  assert.equal(fixture.getUpdateInput()?.results, undefined);
  assert.deepEqual(updated.results, existingMatch.results);
  assert.deepEqual(
    updated.yakumanEvents.map(({ winnerUserId, kind }) => ({
      winnerUserId,
      kind,
    })),
    yakumanEvents,
  );
  assert.equal(fixture.getRebuildCallCount(), 1);
});

test("Match create, update, and delete continue to rebuild statistics", async () => {
  const fixture = makeServiceFixture();

  await fixture.service.createMatch(
    "u1",
    "league-1",
    "season-1",
    "session-1",
    makeCreateInput(),
  );
  await fixture.service.updateMatch(
    "u1",
    "league-1",
    "season-1",
    "session-1",
    "match-1",
    {},
  );
  await fixture.service.deleteMatch(
    "u1",
    "league-1",
    "season-1",
    "session-1",
    "match-1",
  );

  assert.equal(fixture.getCreateCallCount(), 1);
  assert.equal(fixture.getDeleteCallCount(), 1);
  assert.equal(fixture.getRebuildCallCount(), 3);
});
