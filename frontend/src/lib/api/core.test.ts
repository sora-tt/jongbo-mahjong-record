import assert from "node:assert/strict";
import test from "node:test";

import { ApiError, getApiErrorMessage } from "@/lib/api/core";

test("returns cooldown message for 429 with retryAfterSeconds", () => {
  const error = new ApiError("too many requests", 429, null, {
    retryAfterSeconds: 59.1,
  });

  assert.equal(
    getApiErrorMessage(error, "fallback"),
    "60秒後に再送信できます。"
  );
});

test("returns generic retry message for 429 without retryAfterSeconds", () => {
  const error = new ApiError("too many requests", 429);

  assert.equal(
    getApiErrorMessage(error, "fallback"),
    "時間をおいて再度お試しください。"
  );
});

test("keeps existing auth message mapping", () => {
  const error = new ApiError("unauthorized", 401);

  assert.equal(
    getApiErrorMessage(error, "fallback"),
    "ログイン状態を確認できません。再度ログインしてください。"
  );
});
