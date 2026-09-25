import assert from "node:assert/strict";
import test from "node:test";
import {
  getSessionCookieOptions,
  getSessionMaxAgeSeconds,
} from "@/presentation/session.js";

test("session cookie defaults to a five-day HttpOnly cookie", () => {
  const previous = process.env.SESSION_COOKIE_MAX_AGE_SECONDS;
  delete process.env.SESSION_COOKIE_MAX_AGE_SECONDS;

  try {
    assert.equal(getSessionMaxAgeSeconds(), 60 * 60 * 24 * 5);
    assert.deepEqual(getSessionCookieOptions(), {
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
      maxAge: 60 * 60 * 24 * 5,
    });
  } finally {
    if (previous === undefined) {
      delete process.env.SESSION_COOKIE_MAX_AGE_SECONDS;
    } else {
      process.env.SESSION_COOKIE_MAX_AGE_SECONDS = previous;
    }
  }
});

test("session cookie max age accepts a positive environment override", () => {
  const previous = process.env.SESSION_COOKIE_MAX_AGE_SECONDS;
  process.env.SESSION_COOKIE_MAX_AGE_SECONDS = "3600";

  try {
    assert.equal(getSessionMaxAgeSeconds(), 3600);
    assert.equal(getSessionCookieOptions().maxAge, 3600);
  } finally {
    if (previous === undefined) {
      delete process.env.SESSION_COOKIE_MAX_AGE_SECONDS;
    } else {
      process.env.SESSION_COOKIE_MAX_AGE_SECONDS = previous;
    }
  }
});
