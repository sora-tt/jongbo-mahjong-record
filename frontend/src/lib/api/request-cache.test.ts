import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { cachedRequest, clearRequestCache } from "@/lib/api/request-cache";
import { fetchMe, updateMe } from "@/lib/api/users";

Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
const originalFetch = globalThis.fetch;
afterEach(() => {
  clearRequestCache();
  globalThis.fetch = originalFetch;
});

test("deduplicates concurrent requests and reuses the result", async () => {
  let calls = 0;
  let resolve!: (value: string) => void;
  const load = () => {
    calls++;
    return new Promise<string>((done) => {
      resolve = done;
    });
  };
  const first = cachedRequest("user", load);
  const second = cachedRequest("user", load);
  assert.equal(calls, 1);
  resolve("first");
  assert.deepEqual(await Promise.all([first, second]), ["first", "first"]);
  assert.equal(await cachedRequest("user", load), "first");
  assert.equal(calls, 1);
});

test("invalidating an in-flight request prevents an old result from being cached", async () => {
  let resolve!: (value: string) => void;
  const old = cachedRequest(
    "user",
    () =>
      new Promise<string>((done) => {
        resolve = done;
      })
  );
  clearRequestCache();
  assert.equal(await cachedRequest("user", async () => "new"), "new");
  resolve("old");
  assert.equal(await old, "old");
  assert.equal(await cachedRequest("user", async () => "unexpected"), "new");
});

test("updating a profile invalidates the shared user cache", async () => {
  let name = "before";
  let reads = 0;
  globalThis.fetch = async (_input, init) => {
    if (init?.method === "PATCH") name = "after";
    else reads += 1;
    return new Response(JSON.stringify({ data: { id: "user", name } }), {
      status: 200,
    });
  };
  assert.equal((await fetchMe()).name, "before");
  assert.equal((await fetchMe()).name, "before");
  assert.equal(reads, 1);
  await updateMe({ name: "after" });
  assert.equal((await fetchMe()).name, "after");
  assert.equal(reads, 2);
});
