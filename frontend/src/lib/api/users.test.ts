import assert from "node:assert/strict";
import { test } from "node:test";

import { updateMe } from "./users";

test("プロフィール更新を既存の users/me API に送信する", async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl = "";
  let requestInit: RequestInit | undefined;
  globalThis.fetch = async (input, init) => {
    requestUrl = String(input);
    requestInit = init;
    return new Response(
      JSON.stringify({ data: { name: "太郎", username: "taro" } }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  };
  try {
    const result = await updateMe({ name: "太郎", username: "taro" });
    assert.equal(new URL(requestUrl).pathname, "/api/users/me");
    assert.equal(requestInit?.method, "PATCH");
    assert.equal(requestInit?.credentials, "include");
    assert.deepEqual(JSON.parse(String(requestInit?.body)), {
      name: "太郎",
      username: "taro",
    });
    assert.equal(result.name, "太郎");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
