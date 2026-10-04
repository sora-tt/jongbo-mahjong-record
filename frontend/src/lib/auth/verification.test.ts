import assert from "node:assert/strict";
import test from "node:test";

import {
  getAuthRedirectTarget,
  getVerificationAction,
  getRetryMessage,
} from "@/lib/auth/verification";

test("redirects unverified users to the verification waiting page", () => {
  assert.equal(getAuthRedirectTarget(false), "/verify-email");
  assert.equal(getAuthRedirectTarget(true), "/");
});

test("parses verification action and retry text from query params", () => {
  assert.deepEqual(getVerificationAction("?mode=verify&oobCode=abc123"), {
    mode: "verify",
    oobCode: "abc123",
  });

  assert.deepEqual(getVerificationAction("?mode=verify"), {
    mode: "verify",
    oobCode: null,
  });

  assert.equal(getRetryMessage(90), "90秒後に再送信できます");
});
