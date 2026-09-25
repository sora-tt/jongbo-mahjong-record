import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "@/presentation/app.js";

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
        LeagueSummary: { properties: Record<string, unknown> };
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
  const sessionPatchSchema =
    document.paths[
      "/api/leagues/{leagueId}/seasons/{seasonId}/sessions/{sessionId}"
    ].patch?.requestBody?.content?.["application/json"]?.schema;
  assert.deepEqual(Object.keys(sessionPatchSchema?.properties ?? {}).sort(), [
    "endedAt",
    "tableLabel",
  ]);
  const matchPatchSchema =
    document.paths[
      "/api/leagues/{leagueId}/seasons/{seasonId}/sessions/{sessionId}/matches/{matchId}"
    ].patch?.requestBody?.content?.["application/json"]?.schema;
  assert.deepEqual(Object.keys(matchPatchSchema?.properties ?? {}).sort(), [
    "playedAt",
    "results",
  ]);
});
