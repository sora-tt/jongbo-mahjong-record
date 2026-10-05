import assert from "node:assert/strict";
import test from "node:test";

import { getVerificationEmailRedirectUrl } from "@/lib/firebase/auth";

test("verification email redirects to the current app origin when available", () => {
  const previousWindow = (
    globalThis as typeof globalThis & {
      window?: { location: { origin: string } };
    }
  ).window;
  const previousEnvDescriptor = Object.getOwnPropertyDescriptor(process, "env");

  Object.defineProperty(process, "env", {
    value: {
      ...process.env,
      NEXT_PUBLIC_APP_URL: "https://app.example.com",
    },
    configurable: true,
    enumerable: true,
    writable: true,
  });

  Object.defineProperty(globalThis, "window", {
    value: {
      location: {
        origin: "https://frontend.example.com",
      },
    },
    configurable: true,
  });

  try {
    assert.equal(
      getVerificationEmailRedirectUrl(),
      "https://frontend.example.com/verify-email"
    );
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
