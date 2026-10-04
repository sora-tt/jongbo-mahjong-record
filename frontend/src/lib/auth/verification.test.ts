import assert from "node:assert/strict";
import test from "node:test";

import { getApiBaseUrl } from "@/lib/api/core";
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

test("prefers the configured API base URL in production", () => {
  const previousWindow = (
    globalThis as typeof globalThis & {
      window?: { location: { origin: string; hostname: string } };
    }
  ).window;
  const previousEnvDescriptor = Object.getOwnPropertyDescriptor(process, "env");

  Object.defineProperty(process, "env", {
    value: {
      ...process.env,
      NEXT_PUBLIC_API_BASE_URL: "https://api.example.com",
      NODE_ENV: "production",
    },
    configurable: true,
    enumerable: true,
    writable: true,
  });

  Object.defineProperty(globalThis, "window", {
    value: {
      location: {
        origin: "https://app.example.com",
        hostname: "app.example.com",
      },
    },
    configurable: true,
  });

  try {
    assert.equal(getApiBaseUrl(), "https://api.example.com");
  } finally {
    if (previousEnvDescriptor) {
      Object.defineProperty(process, "env", previousEnvDescriptor);
    } else {
      delete (process as { env?: unknown }).env;
    }

    if (previousWindow === undefined) {
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        configurable: true,
      });
    } else {
      Object.defineProperty(globalThis, "window", {
        value: previousWindow,
        configurable: true,
      });
    }
  }
});

test("issue 84 acceptance: verified and unverified state transitions are consistent", () => {
  assert.equal(getAuthRedirectTarget(false), "/verify-email");
  assert.equal(getAuthRedirectTarget(true), "/");

  assert.deepEqual(
    getVerificationAction(
      "https://example.com/verify-email?mode=verify&oobCode=abc123"
    ),
    {
      mode: "verify",
      oobCode: "abc123",
    }
  );

  assert.deepEqual(
    getVerificationAction("https://example.com/verify-email?mode=verify"),
    {
      mode: "verify",
      oobCode: null,
    }
  );

  assert.equal(getRetryMessage(0), "0秒後に再送信できます");
  assert.equal(getRetryMessage(45), "45秒後に再送信できます");
});
