import assert from "node:assert/strict";
import test from "node:test";

import { deleteSeason } from "./index";

test("シーズン削除は対象のリーグとシーズンへDELETEを送る", async () => {
  const originalFetch = globalThis.fetch;
  let request: { url: string; method: string | undefined } | undefined;
  globalThis.fetch = async (input, init) => {
    request = { url: String(input), method: init?.method };
    return new Response(null, { status: 204 });
  };
  try {
    await deleteSeason("league-1", "season-2");
    assert.equal(
      new URL(request!.url).pathname,
      "/api/leagues/league-1/seasons/season-2"
    );
    assert.equal(request!.method, "DELETE");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
