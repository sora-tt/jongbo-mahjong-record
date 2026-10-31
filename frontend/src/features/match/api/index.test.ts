import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { createMatch, updateMatch, type MatchYakumanEventInput } from "./index";

type CapturedRequest = {
  method: string;
  url: string;
  body: Record<string, unknown>;
};

const originalFetch = globalThis.fetch;
const capturedRequests: CapturedRequest[] = [];

const mockFetch = (status: number) => {
  globalThis.fetch = (async (input, init) => {
    const request =
      input instanceof Request ? input.clone() : new Request(input, init);
    const body = await request.json();
    capturedRequests.push({
      method: request.method,
      url: request.url,
      body: body as Record<string, unknown>,
    });
    return new Response(JSON.stringify({ data: { id: "match-1" } }), {
      status,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
};

const createInput = (yakumanEvents?: MatchYakumanEventInput) => ({
  leagueId: "league-1",
  seasonId: "season-1",
  sessionId: "session-1",
  playedAt: "2026-10-31T00:00:00.000Z",
  results: [],
  chomboEvents: [],
  offTableKyotakuCount: 0,
  ...(yakumanEvents === undefined ? {} : { yakumanEvents }),
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  capturedRequests.length = 0;
});

test("createMatch sends an empty yakuman array when there was no yakuman", async () => {
  mockFetch(201);

  await createMatch(createInput([]));

  assert.deepEqual(capturedRequests[0].body.yakumanEvents, []);
});

test("createMatch omits yakumanEvents when a caller does not provide it", async () => {
  mockFetch(201);

  await createMatch(createInput());

  assert.equal("yakumanEvents" in capturedRequests[0].body, false);
});

test("createMatch preserves every composite yakuman entry in order", async () => {
  const events: MatchYakumanEventInput = [
    { winnerUserId: "user-1", kind: "daisangen" },
    { winnerUserId: "user-1", kind: "suuankouTanki" },
    { winnerUserId: "user-2", kind: "junseiChuurenPoutou" },
  ];
  mockFetch(201);

  await createMatch(createInput(events));

  assert.deepEqual(capturedRequests[0].body.yakumanEvents, events);
});

test("updateMatch sends an explicit empty array so saved records can be cleared", async () => {
  mockFetch(200);

  await updateMatch({
    leagueId: "league-1",
    seasonId: "season-1",
    sessionId: "session-1",
    matchId: "match-1",
    yakumanEvents: [],
  });

  assert.deepEqual(capturedRequests[0].body.yakumanEvents, []);
});

test("updateMatch preserves composite yakuman entries in order", async () => {
  const events: MatchYakumanEventInput = [
    { winnerUserId: "user-1", kind: "kokushiMusou" },
    { winnerUserId: "user-1", kind: "kokushi13Wait" },
  ];
  mockFetch(200);

  await updateMatch({
    leagueId: "league-1",
    seasonId: "season-1",
    sessionId: "session-1",
    matchId: "match-1",
    yakumanEvents: events,
  });

  assert.deepEqual(capturedRequests[0].body.yakumanEvents, events);
});

test("updateMatch omits yakumanEvents when a caller does not provide it", async () => {
  mockFetch(200);

  await updateMatch({
    leagueId: "league-1",
    seasonId: "season-1",
    sessionId: "session-1",
    matchId: "match-1",
  });

  assert.equal("yakumanEvents" in capturedRequests[0].body, false);
});
