import assert from "node:assert/strict";
import test from "node:test";
import { Hono } from "hono";
import { validateLeagueRule } from "@/domain/league/rule.js";
import { AppError } from "@/domain/shared/errors.js";
import type { Services } from "@/presentation/dependencies.js";
import type { AppBindings } from "@/presentation/bindings.js";
import { buildAuthRouter } from "@/presentation/routes/auth.js";
import { createApp } from "@/presentation/app.js";
import { buildLeaguesRouter } from "@/presentation/routes/leagues.js";
import { createLeagueSchema } from "@/presentation/schemas/league.js";

const floatingRule = {
  gameType: "yonma",
  oka: { startingPoints: 25000, returnPoints: 25000 },
  uma: {
    mode: "floatingCount",
    pointsByFloatingCount: {
      "0": { first: 0, second: 0, third: 0, fourth: 0 },
      "1": { first: 12, second: -1, third: -3, fourth: -8 },
      "2": { first: 8, second: 4, third: -4, fourth: -8 },
      "3": { first: 8, second: 3, third: 1, fourth: -12 },
      "4": { first: 0, second: 0, third: 0, fourth: 0 },
    },
  },
  rotateSeatOrder: true,
} as const;

const createLeagueContractApp = () => {
  const services = {
    leagueService: {
      createLeague: async (
        _userId: string,
        input: { rule: Parameters<typeof validateLeagueRule>[0] },
      ) => {
        validateLeagueRule(input.rule);
        return { id: "league-1", rule: input.rule };
      },
      updateLeague: async (
        _userId: string,
        _leagueId: string,
        input: { rule?: Parameters<typeof validateLeagueRule>[0] },
      ) => {
        if (input.rule) validateLeagueRule(input.rule);
        return { id: "league-1", rule: input.rule };
      },
    },
  } as unknown as Services;

  const app = new Hono<AppBindings>();
  app.use("/api/leagues", async (c, next) => {
    c.set("authUser", {
      uid: "owner",
      email: null,
      name: null,
      emailVerified: false,
    });
    await next();
  });
  app.use("/api/leagues/*", async (c, next) => {
    c.set("authUser", {
      uid: "owner",
      email: null,
      name: null,
      emailVerified: false,
    });
    await next();
  });
  app.route("/api/leagues", buildLeaguesRouter(services));
  app.onError((error, c) => {
    if (error instanceof AppError) {
      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            details: error.details ?? {},
          },
        },
        error.status as 400 | 401 | 403 | 404 | 409 | 500,
      );
    }
    throw error;
  });
  return app;
};

test("normalizes legacy fixed rules and accepts only valid gameType/mode pairs", () => {
  const legacyFixedInput = {
    name: "Legacy League",
    memberUserIds: [],
    rule: {
      gameType: "yonma",
      uma: { first: 20, second: 10, third: -10, fourth: -20 },
      oka: { startingPoints: 25000, returnPoints: 30000 },
    },
  };

  assert.deepEqual(createLeagueSchema.parse(legacyFixedInput).rule.uma, {
    mode: "fixed",
    first: 20,
    second: 10,
    third: -10,
    fourth: -20,
  });
  assert.equal(
    createLeagueSchema.parse(legacyFixedInput).rule.rotateSeatOrder,
    false,
  );
  assert.equal(
    createLeagueSchema.safeParse({
      ...legacyFixedInput,
      rule: {
        ...legacyFixedInput.rule,
        uma: { mode: "fixed", ...legacyFixedInput.rule.uma },
      },
    }).success,
    true,
  );
  assert.equal(
    createLeagueSchema.safeParse({
      ...legacyFixedInput,
      rule: floatingRule,
    }).success,
    true,
  );
  assert.equal(
    createLeagueSchema.safeParse({
      ...legacyFixedInput,
      rule: { ...floatingRule, gameType: "sanma" },
    }).success,
    false,
  );
  assert.equal(
    createLeagueSchema.safeParse({
      ...legacyFixedInput,
      rule: { ...legacyFixedInput.rule, rotateSeatOrder: "yes" },
    }).success,
    false,
  );
});

test("League create/update routes accept floatingCount rules and return the canonical five rows", async () => {
  const app = createLeagueContractApp();
  const createResponse = await app.request("/api/leagues", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "浮き人数別",
      rule: floatingRule,
      memberUserIds: [],
    }),
  });
  const createBody = (await createResponse.json()) as {
    data: {
      rule: {
        uma: { mode: string; pointsByFloatingCount: unknown };
        rotateSeatOrder: boolean;
      };
    };
  };

  assert.equal(createResponse.status, 201);
  assert.equal(createBody.data.rule.uma.mode, "floatingCount");
  assert.equal(createBody.data.rule.rotateSeatOrder, true);
  assert.deepEqual(
    createBody.data.rule.uma.pointsByFloatingCount,
    floatingRule.uma.pointsByFloatingCount,
  );

  const updateResponse = await app.request("/api/leagues/league-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rule: floatingRule }),
  });
  const updateBody = (await updateResponse.json()) as {
    data: {
      rule: {
        uma: { mode: string; pointsByFloatingCount: unknown };
        rotateSeatOrder: boolean;
      };
    };
  };

  assert.equal(updateResponse.status, 200);
  assert.equal(updateBody.data.rule.uma.mode, "floatingCount");
  assert.equal(updateBody.data.rule.rotateSeatOrder, true);
  assert.deepEqual(
    updateBody.data.rule.uma.pointsByFloatingCount,
    floatingRule.uma.pointsByFloatingCount,
  );
});

test("League create/update routes preserve legacy fixed requests and return mode=fixed", async () => {
  const app = createLeagueContractApp();
  const legacyRule = {
    gameType: "yonma",
    oka: { startingPoints: 25000, returnPoints: 30000 },
    uma: { first: 20, second: 10, third: -10, fourth: -20 },
  };

  const createResponse = await app.request("/api/leagues", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "旧形式",
      rule: legacyRule,
      memberUserIds: [],
    }),
  });
  const createBody = (await createResponse.json()) as {
    data: { rule: { uma: { mode: string }; rotateSeatOrder: boolean } };
  };

  assert.equal(createResponse.status, 201);
  assert.equal(createBody.data.rule.uma.mode, "fixed");
  assert.equal(createBody.data.rule.rotateSeatOrder, false);

  const updateResponse = await app.request("/api/leagues/league-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rule: legacyRule }),
  });
  const updateBody = (await updateResponse.json()) as {
    data: { rule: { uma: { mode: string }; rotateSeatOrder: boolean } };
  };

  assert.equal(updateResponse.status, 200);
  assert.equal(updateBody.data.rule.uma.mode, "fixed");
  assert.equal(updateBody.data.rule.rotateSeatOrder, false);
});

test("League routes return ErrorEnvelope for invalid floatingCount rows", async () => {
  const app = createLeagueContractApp();
  const invalidRule = {
    ...floatingRule,
    uma: {
      ...floatingRule.uma,
      pointsByFloatingCount: {
        ...floatingRule.uma.pointsByFloatingCount,
        "2": { first: 9, second: 4, third: -4, fourth: -8 },
      },
    },
  };

  for (const request of [
    {
      path: "/api/leagues",
      method: "POST",
      body: { name: "不正ルール", rule: invalidRule, memberUserIds: [] },
      expectedStatus: 400,
    },
    {
      path: "/api/leagues/league-1",
      method: "PATCH",
      body: { rule: invalidRule },
      expectedStatus: 400,
    },
  ]) {
    const response = await app.request(request.path, {
      method: request.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request.body),
    });
    const body = (await response.json()) as {
      error: {
        code: string;
        message: string;
        details: Record<string, unknown>;
      };
    };

    assert.equal(response.status, request.expectedStatus);
    assert.equal(body.error.code, "validation_error");
    assert.equal(
      body.error.message,
      "floatingCount 2 rule.uma must total zero",
    );
    assert.deepEqual(body.error.details, {
      field: "rule.uma",
      mode: "floatingCount",
      floatingCount: 2,
      expectedTotal: 0,
      actualTotal: 1,
    });
  }
});

test("League routes return ErrorEnvelope for missing rows and reject sanma floatingCount", async () => {
  const app = createLeagueContractApp();
  const missingRowRule = {
    ...floatingRule,
    uma: {
      ...floatingRule.uma,
      pointsByFloatingCount: {
        ...floatingRule.uma.pointsByFloatingCount,
        "4": undefined,
      },
    },
  };
  const nonIntegerRule = {
    ...floatingRule,
    uma: {
      ...floatingRule.uma,
      pointsByFloatingCount: {
        ...floatingRule.uma.pointsByFloatingCount,
        "3": { first: 8.5, second: 3, third: 1, fourth: -12 },
      },
    },
  };

  for (const rule of [missingRowRule, nonIntegerRule]) {
    const response = await app.request("/api/leagues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "invalid floating rows",
        rule,
        memberUserIds: [],
      }),
    });
    const body = (await response.json()) as {
      error: { code: string; message: string; details: { issues: unknown[] } };
    };

    assert.equal(response.status, 400);
    assert.equal(body.error.code, "validation_error");
    assert.equal(body.error.message, "request validation failed");
    assert.ok(body.error.details.issues.length > 0);
  }

  const sanmaRule = {
    ...floatingRule,
    gameType: "sanma",
  };
  const sanmaResponse = await app.request("/api/leagues", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "三麻", rule: sanmaRule, memberUserIds: [] }),
  });
  const sanmaBody = (await sanmaResponse.json()) as {
    error: { code: string };
  };

  assert.equal(sanmaResponse.status, 400);
  assert.equal(sanmaBody.error.code, "validation_error");
});

test("health endpoint returns the standard data envelope", async () => {
  const response = await createApp().request("/api/health");
  const body = (await response.json()) as {
    data: { status: string; timestamp: string };
  };

  assert.equal(response.status, 200);
  assert.equal(body.data.status, "ok");
  assert.ok(!Number.isNaN(Date.parse(body.data.timestamp)));
});

test("protected routes reject requests without the session cookie", async () => {
  const response = await createApp().request("/api/leagues");
  const body = (await response.json()) as {
    error: { code: string; details: Record<string, unknown> };
  };

  assert.equal(response.status, 401);
  assert.equal(body.error.code, "authentication_error");
  assert.deepEqual(body.error.details, {});
});

test("session exchange requires the x-id-token header", async () => {
  const response = await createApp().request("/api/auth/session", {
    method: "POST",
  });
  const body = (await response.json()) as {
    error: { code: string; details: Record<string, unknown> };
  };

  assert.equal(response.status, 401);
  assert.equal(body.error.code, "authentication_error");
  assert.deepEqual(body.error.details, {});
});

test("session deletion returns an empty 204 response", async () => {
  const response = await createApp().request("/api/auth/session", {
    method: "DELETE",
  });

  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
});

test("verification email route sends a link for an unverified user", async () => {
  const mockAuth = {
    verifySessionCookie: async () => ({
      uid: "user-123",
      email: "user@example.com",
      name: "Test User",
      email_verified: false,
    }),
    getUser: async () => ({
      uid: "user-123",
      email: "user@example.com",
      emailVerified: false,
    }),
    generateEmailVerificationLink: async () =>
      "http://127.0.0.1:3000/verify-email?mode=verify&oobCode=test-code",
  };

  const app = new Hono().route(
    "/api/auth",
    buildAuthRouter({ getAdminAuth: () => mockAuth as never }),
  );

  const response = await app.request("/api/auth/verification-email", {
    method: "POST",
    headers: {
      Cookie: "jongbo_session=mock-session-cookie",
    },
  });
  const body = (await response.json()) as {
    data: {
      sent: boolean;
      email: string;
      verificationUrl: string;
    };
  };

  assert.equal(response.status, 200);
  assert.equal(body.data.sent, true);
  assert.equal(body.data.email, "user@example.com");
  assert.match(
    body.data.verificationUrl,
    /^http:\/\/127\.0\.0\.1:3000\/verify-email\?mode=verify/,
  );
});

test("verification email route uses the production frontend URL from Vercel env vars", async () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const previousVercelProjectProductionUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const previousVercelBranchUrl = process.env.VERCEL_BRANCH_URL;
  const previousVercelUrl = process.env.VERCEL_URL;

  delete process.env.NEXT_PUBLIC_APP_URL;
  process.env.VERCEL_PROJECT_PRODUCTION_URL =
    "jongbo-mahjong-record.vercel.app";
  delete process.env.VERCEL_BRANCH_URL;
  delete process.env.VERCEL_URL;

  try {
    const mockAuth = {
      verifySessionCookie: async () => ({
        uid: "prod-user-123",
        email: "prod@example.com",
        email_verified: false,
      }),
      getUser: async () => ({
        uid: "prod-user-123",
        email: "prod@example.com",
        emailVerified: false,
      }),
      generateEmailVerificationLink: async (
        email: string,
        options: { url: string },
      ) =>
        `${options.url}?mode=verify&oobCode=prod-code&email=${encodeURIComponent(email)}`,
    };

    const app = new Hono().route(
      "/api/auth",
      buildAuthRouter({ getAdminAuth: () => mockAuth as never }),
    );

    const response = await app.request("/api/auth/verification-email", {
      method: "POST",
      headers: {
        Cookie: "jongbo_session=mock-session-cookie",
      },
    });
    const body = (await response.json()) as {
      data: { verificationUrl: string };
    };

    assert.equal(response.status, 200);
    assert.match(
      body.data.verificationUrl,
      /^https:\/\/jongbo-mahjong-record\.vercel\.app\/verify-email\?mode=verify/,
    );
  } finally {
    if (previousAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
    }

    if (previousVercelProjectProductionUrl === undefined) {
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    } else {
      process.env.VERCEL_PROJECT_PRODUCTION_URL =
        previousVercelProjectProductionUrl;
    }

    if (previousVercelBranchUrl === undefined) {
      delete process.env.VERCEL_BRANCH_URL;
    } else {
      process.env.VERCEL_BRANCH_URL = previousVercelBranchUrl;
    }

    if (previousVercelUrl === undefined) {
      delete process.env.VERCEL_URL;
    } else {
      process.env.VERCEL_URL = previousVercelUrl;
    }
  }
});

test("verification email route ignores the Vercel API host and prefers the frontend URL", async () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const previousVercelProjectProductionUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const previousVercelBranchUrl = process.env.VERCEL_BRANCH_URL;
  const previousVercelUrl = process.env.VERCEL_URL;

  delete process.env.NEXT_PUBLIC_APP_URL;
  process.env.VERCEL_PROJECT_PRODUCTION_URL =
    "https://api-jongbo-mahjong-record.vercel.app";
  process.env.VERCEL_BRANCH_URL =
    "https://jongbo-mahjong-record-git-feat-issue-125.vercel.app";
  delete process.env.VERCEL_URL;

  try {
    const mockAuth = {
      verifySessionCookie: async () => ({
        uid: "api-host-user-123",
        email: "api-host@example.com",
        email_verified: false,
      }),
      getUser: async () => ({
        uid: "api-host-user-123",
        email: "api-host@example.com",
        emailVerified: false,
      }),
      generateEmailVerificationLink: async (
        email: string,
        options: { url: string },
      ) =>
        `${options.url}?mode=verify&oobCode=api-host-code&email=${encodeURIComponent(email)}`,
    };

    const app = new Hono().route(
      "/api/auth",
      buildAuthRouter({ getAdminAuth: () => mockAuth as never }),
    );

    const response = await app.request("/api/auth/verification-email", {
      method: "POST",
      headers: {
        Cookie: "jongbo_session=mock-session-cookie",
      },
    });
    const body = (await response.json()) as {
      data: { verificationUrl: string };
    };

    assert.equal(response.status, 200);
    assert.match(
      body.data.verificationUrl,
      /^https:\/\/jongbo-mahjong-record\.vercel\.app\/verify-email\?mode=verify/,
    );
    assert.doesNotMatch(body.data.verificationUrl, /api-jongbo-mahjong-record/);
    assert.doesNotMatch(
      body.data.verificationUrl,
      /jongbo-mahjong-record-git-/,
    );
  } finally {
    if (previousAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
    }

    if (previousVercelProjectProductionUrl === undefined) {
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    } else {
      process.env.VERCEL_PROJECT_PRODUCTION_URL =
        previousVercelProjectProductionUrl;
    }

    if (previousVercelBranchUrl === undefined) {
      delete process.env.VERCEL_BRANCH_URL;
    } else {
      process.env.VERCEL_BRANCH_URL = previousVercelBranchUrl;
    }

    if (previousVercelUrl === undefined) {
      delete process.env.VERCEL_URL;
    } else {
      process.env.VERCEL_URL = previousVercelUrl;
    }
  }
});

test("verification email route normalizes backend Vercel hosts to the frontend production URL", async () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const previousVercelProjectProductionUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const previousVercelBranchUrl = process.env.VERCEL_BRANCH_URL;
  const previousVercelUrl = process.env.VERCEL_URL;

  delete process.env.NEXT_PUBLIC_APP_URL;
  process.env.VERCEL_PROJECT_PRODUCTION_URL =
    "https://api-jongbo-mahjong-record.vercel.app";
  delete process.env.VERCEL_BRANCH_URL;
  process.env.VERCEL_URL =
    "https://jongbo-mahjong-record-backend-9g9cgx79u.vercel.app";

  try {
    const mockAuth = {
      verifySessionCookie: async () => ({
        uid: "backend-vhost-user-123",
        email: "backend-vhost@example.com",
        email_verified: false,
      }),
      getUser: async () => ({
        uid: "backend-vhost-user-123",
        email: "backend-vhost@example.com",
        emailVerified: false,
      }),
      generateEmailVerificationLink: async (
        email: string,
        options: { url: string },
      ) =>
        `${options.url}?mode=verify&oobCode=backend-vhost-code&email=${encodeURIComponent(email)}`,
    };

    const app = new Hono().route(
      "/api/auth",
      buildAuthRouter({ getAdminAuth: () => mockAuth as never }),
    );

    const response = await app.request("/api/auth/verification-email", {
      method: "POST",
      headers: {
        Cookie: "jongbo_session=mock-session-cookie",
      },
    });
    const body = (await response.json()) as {
      data: { verificationUrl: string };
    };

    assert.equal(response.status, 200);
    assert.match(
      body.data.verificationUrl,
      /^https:\/\/jongbo-mahjong-record\.vercel\.app\/verify-email\?mode=verify/,
    );
    assert.doesNotMatch(body.data.verificationUrl, /api-jongbo-mahjong-record/);
    assert.doesNotMatch(
      body.data.verificationUrl,
      /jongbo-mahjong-record-backend-/,
    );
  } finally {
    if (previousAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
    }

    if (previousVercelProjectProductionUrl === undefined) {
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    } else {
      process.env.VERCEL_PROJECT_PRODUCTION_URL =
        previousVercelProjectProductionUrl;
    }

    if (previousVercelBranchUrl === undefined) {
      delete process.env.VERCEL_BRANCH_URL;
    } else {
      process.env.VERCEL_BRANCH_URL = previousVercelBranchUrl;
    }

    if (previousVercelUrl === undefined) {
      delete process.env.VERCEL_URL;
    } else {
      process.env.VERCEL_URL = previousVercelUrl;
    }
  }
});

test("verification email route prefers the deployed production URL even when localhost is configured", async () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const previousVercelProjectProductionUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const previousVercelBranchUrl = process.env.VERCEL_BRANCH_URL;
  const previousVercelUrl = process.env.VERCEL_URL;

  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  process.env.VERCEL_PROJECT_PRODUCTION_URL =
    "jongbo-mahjong-record.vercel.app";
  delete process.env.VERCEL_BRANCH_URL;
  delete process.env.VERCEL_URL;

  try {
    const mockAuth = {
      verifySessionCookie: async () => ({
        uid: "localhost-user-123",
        email: "localhost@example.com",
        email_verified: false,
      }),
      getUser: async () => ({
        uid: "localhost-user-123",
        email: "localhost@example.com",
        emailVerified: false,
      }),
      generateEmailVerificationLink: async (
        email: string,
        options: { url: string },
      ) =>
        `${options.url}?mode=verify&oobCode=localhost-code&email=${encodeURIComponent(email)}`,
    };

    const app = new Hono().route(
      "/api/auth",
      buildAuthRouter({ getAdminAuth: () => mockAuth as never }),
    );

    const response = await app.request("/api/auth/verification-email", {
      method: "POST",
      headers: {
        Cookie: "jongbo_session=mock-session-cookie",
      },
    });
    const body = (await response.json()) as {
      data: { verificationUrl: string };
    };

    assert.equal(response.status, 200);
    assert.match(
      body.data.verificationUrl,
      /^https:\/\/jongbo-mahjong-record\.vercel\.app\/verify-email\?mode=verify/,
    );
    assert.doesNotMatch(body.data.verificationUrl, /localhost:3000/);
  } finally {
    if (previousAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
    }

    if (previousVercelProjectProductionUrl === undefined) {
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    } else {
      process.env.VERCEL_PROJECT_PRODUCTION_URL =
        previousVercelProjectProductionUrl;
    }

    if (previousVercelBranchUrl === undefined) {
      delete process.env.VERCEL_BRANCH_URL;
    } else {
      process.env.VERCEL_BRANCH_URL = previousVercelBranchUrl;
    }

    if (previousVercelUrl === undefined) {
      delete process.env.VERCEL_URL;
    } else {
      process.env.VERCEL_URL = previousVercelUrl;
    }
  }
});

test("verification confirmation route accepts a valid action code and marks the user as verified", async () => {
  const mockAuth = {
    verifySessionCookie: async () => ({
      uid: "user-123",
      email: "user@example.com",
      email_verified: false,
    }),
    applyActionCode: async (oobCode: string) => {
      assert.equal(oobCode, "test-oob-code");
      return { data: { email: "user@example.com" } };
    },
    getUser: async () => ({
      uid: "user-123",
      email: "user@example.com",
      emailVerified: false,
    }),
  };

  const app = new Hono().route(
    "/api/auth",
    buildAuthRouter({ getAdminAuth: () => mockAuth as never }),
  );

  const response = await app.request("/api/auth/verify-email", {
    method: "POST",
    headers: {
      Cookie: "jongbo_session=mock-session-cookie",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ oobCode: "test-oob-code" }),
  });
  const body = (await response.json()) as {
    data: {
      verified: boolean;
      email: string;
      verifiedAt: string;
    };
  };

  assert.equal(response.status, 200);
  assert.equal(body.data.verified, true);
  assert.equal(body.data.email, "user@example.com");
  assert.ok(!Number.isNaN(Date.parse(body.data.verifiedAt)));
});

test("verification confirmation route rejects missing action codes", async () => {
  const mockAuth = {
    verifySessionCookie: async () => ({
      uid: "user-123",
      email: "user@example.com",
      email_verified: false,
    }),
  };

  const app = new Hono().route(
    "/api/auth",
    buildAuthRouter({ getAdminAuth: () => mockAuth as never }),
  );

  const response = await app.request("/api/auth/verify-email", {
    method: "POST",
    headers: {
      Cookie: "jongbo_session=mock-session-cookie",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  const body = (await response.json()) as {
    error: { code: string };
  };

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "validation_error");
});

test("verification email route enforces resend cooldowns", async () => {
  const mockAuth = {
    verifySessionCookie: async () => ({
      uid: "user-cooldown",
      email: "cooldown@example.com",
      email_verified: false,
    }),
    getUser: async () => ({
      uid: "user-cooldown",
      email: "cooldown@example.com",
      emailVerified: false,
    }),
    generateEmailVerificationLink: async () =>
      "http://127.0.0.1:3000/verify-email?mode=verify&oobCode=next-code",
  };

  const app = new Hono().route(
    "/api/auth",
    buildAuthRouter({ getAdminAuth: () => mockAuth as never }),
  );

  const firstResponse = await app.request("/api/auth/verification-email", {
    method: "POST",
    headers: {
      Cookie: "jongbo_session=mock-session-cookie",
    },
  });
  const firstBody = (await firstResponse.json()) as {
    data: { sent: boolean; retryAfterSeconds?: number };
  };

  assert.equal(firstResponse.status, 200);
  assert.equal(firstBody.data.sent, true);

  const secondResponse = await app.request("/api/auth/verification-email", {
    method: "POST",
    headers: {
      Cookie: "jongbo_session=mock-session-cookie",
    },
  });
  const secondBody = (await secondResponse.json()) as {
    error: { code: string; details: { retryAfterSeconds?: number } };
  };

  assert.equal(secondResponse.status, 429);
  assert.equal(secondBody.error.code, "rate_limited");
  assert.ok((secondBody.error.details.retryAfterSeconds ?? 0) > 0);
});

test("issue 84 acceptance: verification flow handles pending, rate-limited, and verified states", async () => {
  const mockAuth = {
    verifySessionCookie: async () => ({
      uid: "issue84-acceptance-user",
      email: "issue84@example.com",
      email_verified: false,
    }),
    getUser: async () => ({
      uid: "issue84-acceptance-user",
      email: "issue84@example.com",
      emailVerified: false,
    }),
    generateEmailVerificationLink: async () =>
      "http://127.0.0.1:3000/verify-email?mode=verify&oobCode=valid-oob-code",
    applyActionCode: async (oobCode: string) => {
      if (oobCode !== "valid-oob-code") {
        throw new Error("invalid verification code");
      }
      return { data: { email: "issue84@example.com" } };
    },
  };

  const app = new Hono().route(
    "/api/auth",
    buildAuthRouter({ getAdminAuth: () => mockAuth as never }),
  );

  const sendResponse = await app.request("/api/auth/verification-email", {
    method: "POST",
    headers: {
      Cookie: "jongbo_session=mock-session-cookie",
    },
  });
  assert.equal(sendResponse.status, 200);

  const rateLimitedResponse = await app.request(
    "/api/auth/verification-email",
    {
      method: "POST",
      headers: {
        Cookie: "jongbo_session=mock-session-cookie",
      },
    },
  );
  const rateLimitedBody = (await rateLimitedResponse.json()) as {
    error: { code: string; details: { retryAfterSeconds?: number } };
  };
  assert.equal(rateLimitedResponse.status, 429);
  assert.equal(rateLimitedBody.error.code, "rate_limited");
  assert.ok((rateLimitedBody.error.details.retryAfterSeconds ?? 0) > 0);

  const missingCodeResponse = await app.request("/api/auth/verify-email", {
    method: "POST",
    headers: {
      Cookie: "jongbo_session=mock-session-cookie",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  const missingCodeBody = (await missingCodeResponse.json()) as {
    error: { code: string };
  };
  assert.equal(missingCodeResponse.status, 400);
  assert.equal(missingCodeBody.error.code, "validation_error");

  const invalidCodeResponse = await app.request("/api/auth/verify-email", {
    method: "POST",
    headers: {
      Cookie: "jongbo_session=mock-session-cookie",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ oobCode: "invalid-oob-code" }),
  });
  const invalidCodeBody = (await invalidCodeResponse.json()) as {
    error: { code: string };
  };
  assert.equal(invalidCodeResponse.status, 400);
  assert.equal(invalidCodeBody.error.code, "validation_error");

  const validCodeResponse = await app.request("/api/auth/verify-email", {
    method: "POST",
    headers: {
      Cookie: "jongbo_session=mock-session-cookie",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ oobCode: "valid-oob-code" }),
  });
  const validCodeBody = (await validCodeResponse.json()) as {
    data: { verified: boolean; email: string };
  };
  assert.equal(validCodeResponse.status, 200);
  assert.equal(validCodeBody.data.verified, true);
  assert.equal(validCodeBody.data.email, "issue84@example.com");
});

test("CORS only allows configured origins and credentials", async () => {
  const app = createApp();
  const allowed = await app.request("/api/health", {
    headers: { Origin: "http://localhost:3000" },
  });
  const denied = await app.request("/api/health", {
    headers: { Origin: "https://untrusted.example" },
  });

  assert.equal(
    allowed.headers.get("access-control-allow-origin"),
    "http://localhost:3000",
  );
  assert.equal(allowed.headers.get("access-control-allow-credentials"), "true");
  assert.equal(denied.headers.get("access-control-allow-origin"), null);
});

test("OpenAPI publishes the canonical auth and match request contracts", async () => {
  const response = await createApp().request("/doc");
  const document = (await response.json()) as {
    paths: Record<
      string,
      Record<
        string,
        {
          parameters?: Array<{ name?: string }>;
          requestBody?: {
            content?: {
              "application/json"?: {
                schema?: {
                  properties?: Record<string, unknown>;
                };
              };
            };
          };
          tags?: string[];
          summary?: string;
        }
      >
    >;
    components: {
      schemas: {
        CreateMatchInput: { properties: Record<string, unknown> };
        CreateSessionInput: {
          properties: Record<string, unknown>;
          required?: string[];
        };
        LeagueSummary: { properties: Record<string, unknown> };
        LeagueRule: { oneOf?: Array<{ $ref?: string }> };
        LeagueRuleInput: { oneOf?: Array<{ $ref?: string }> };
        UmaRule: {
          oneOf?: Array<{ $ref?: string }>;
          discriminator?: {
            propertyName?: string;
            mapping?: Record<string, string>;
          };
        };
        FixedYonmaUma: {
          properties: Record<string, unknown>;
          required?: string[];
        };
        LegacyFixedSanmaUma: {
          properties: Record<string, unknown>;
          required?: string[];
          additionalProperties?: boolean;
        };
        LegacyFixedYonmaUma: {
          properties: Record<string, unknown>;
          required?: string[];
          additionalProperties?: boolean;
        };
        FloatingCountRankPointsTable: {
          properties: Record<string, unknown>;
          required?: string[];
        };
        LeagueDetail: { properties: Record<string, unknown> };
      };
    };
  };

  assert.equal(response.status, 200);
  assert.equal(
    document.paths["/api/auth/session"].post.parameters?.[0].name,
    "x-id-token",
  );
  assert.equal(
    "rank" in document.components.schemas.CreateMatchInput.properties,
    false,
  );
  assert.equal(
    "rule" in document.components.schemas.LeagueSummary.properties,
    false,
  );
  assert.equal(
    "createdBy" in document.components.schemas.CreateSessionInput.properties,
    false,
  );
  assert.deepEqual(document.components.schemas.CreateSessionInput.required, [
    "startedAt",
    "memberUserIds",
  ]);
  assert.deepEqual(
    document.components.schemas.LeagueRule.oneOf?.map(({ $ref }) => $ref),
    [
      "#/components/schemas/FixedSanmaLeagueRule",
      "#/components/schemas/FixedYonmaLeagueRule",
      "#/components/schemas/FloatingCountYonmaLeagueRule",
    ],
  );
  assert.deepEqual(
    document.components.schemas.LeagueRuleInput.oneOf?.map(({ $ref }) => $ref),
    [
      "#/components/schemas/FixedSanmaLeagueRuleInput",
      "#/components/schemas/FixedYonmaLeagueRuleInput",
      "#/components/schemas/FloatingCountYonmaLeagueRuleInput",
      "#/components/schemas/LegacyFixedSanmaLeagueRule",
      "#/components/schemas/LegacyFixedYonmaLeagueRule",
    ],
  );
  assert.deepEqual(
    document.components.schemas.UmaRule.oneOf?.map(({ $ref }) => $ref),
    ["#/components/schemas/FixedUma", "#/components/schemas/FloatingCountUma"],
  );
  assert.deepEqual(document.components.schemas.UmaRule.discriminator, {
    propertyName: "mode",
    mapping: {
      fixed: "#/components/schemas/FixedUma",
      floatingCount: "#/components/schemas/FloatingCountUma",
    },
  });
  assert.equal(
    "mode" in document.components.schemas.FixedYonmaUma.properties,
    true,
  );
  for (const legacyUma of [
    document.components.schemas.LegacyFixedSanmaUma,
    document.components.schemas.LegacyFixedYonmaUma,
  ]) {
    assert.equal("mode" in legacyUma.properties, false);
    assert.equal(legacyUma.additionalProperties, false);
  }
  assert.deepEqual(
    document.components.schemas.FloatingCountRankPointsTable.required,
    ["0", "1", "2", "3", "4"],
  );
  assert.deepEqual(
    Object.keys(
      document.components.schemas.FloatingCountRankPointsTable.properties,
    ).sort(),
    ["0", "1", "2", "3", "4"],
  );
  assert.deepEqual(document.components.schemas.LeagueDetail.properties.rule, {
    $ref: "#/components/schemas/LeagueRule",
  });
  const leaguePath = document.paths["/api/leagues/{leagueId}"];
  assert.deepEqual(
    leaguePath.delete?.parameters?.map((parameter) => parameter.name),
    ["leagueId"],
  );
  assert.deepEqual(leaguePath.delete?.tags, ["Leagues"]);
  assert.equal(leaguePath.delete?.summary, "delete league");
  assert.deepEqual(
    Object.keys(
      leaguePath.patch?.requestBody?.content?.["application/json"]?.schema
        ?.properties ?? {},
    ).sort(),
    ["memberUserIds", "name", "rule"],
  );
  assert.deepEqual(
    Object.keys(
      document.paths["/api/leagues/{leagueId}/seasons/{seasonId}"].patch
        ?.requestBody?.content?.["application/json"]?.schema?.properties ?? {},
    ).sort(),
    ["name", "status"],
  );
  const seasonPath =
    document.paths["/api/leagues/{leagueId}/seasons/{seasonId}"];
  assert.deepEqual(
    seasonPath.delete?.parameters?.map((parameter) => parameter.name),
    ["leagueId", "seasonId"],
  );
  assert.deepEqual(seasonPath.delete?.tags, ["Seasons"]);
  assert.equal(seasonPath.delete?.summary, "delete season");
  const sessionPath =
    document.paths[
      "/api/leagues/{leagueId}/seasons/{seasonId}/sessions/{sessionId}"
    ];
  assert.deepEqual(
    sessionPath.delete?.parameters?.map((parameter) => parameter.name),
    ["leagueId", "seasonId", "sessionId"],
  );
  assert.deepEqual(sessionPath.delete?.tags, ["Sessions"]);
  assert.equal(sessionPath.delete?.summary, "delete session");
  const sessionPatchSchema =
    sessionPath.patch?.requestBody?.content?.["application/json"]?.schema;
  assert.deepEqual(Object.keys(sessionPatchSchema?.properties ?? {}).sort(), [
    "endedAt",
    "tableLabel",
  ]);
  const matchPatchSchema =
    document.paths[
      "/api/leagues/{leagueId}/seasons/{seasonId}/sessions/{sessionId}/matches/{matchId}"
    ].patch?.requestBody?.content?.["application/json"]?.schema;
  assert.deepEqual(Object.keys(matchPatchSchema?.properties ?? {}).sort(), [
    "chomboEvents",
    "offTableKyotakuCount",
    "playedAt",
    "results",
  ]);
});
