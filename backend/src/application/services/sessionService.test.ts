import assert from "node:assert/strict";
import test from "node:test";
import { SessionService } from "@/application/services/sessionService.js";
import type { StatsRebuilder } from "@/application/services/statsRebuilder.js";
import type { LeagueRepository } from "@/domain/league/repository.js";
import type { SeasonRepository } from "@/domain/season/repository.js";
import type { SessionRepository } from "@/domain/session/repository.js";

const makeService = (gameType: "sanma" | "yonma") => {
  let createdMemberIds: string[] | undefined;
  const leagueRepository = {
    getRule: async () => ({
      gameType,
      uma: {
        first: 20,
        second: 10,
        third: -10,
        fourth: gameType === "yonma" ? -20 : null,
      },
      oka: { startingPoints: 25000, returnPoints: 30000 },
    }),
    listMembers: async () => [
      { id: "member-1", userId: "u1", userName: "A" },
      { id: "member-2", userId: "u2", userName: "B" },
      { id: "member-3", userId: "u3", userName: "C" },
      { id: "member-4", userId: "u4", userName: "D" },
    ],
  } as unknown as LeagueRepository;
  const seasonRepository = {
    listMembers: async () => [
      { userId: "u1", userName: "A" },
      { userId: "u2", userName: "B" },
      { userId: "u3", userName: "C" },
      { userId: "u4", userName: "D" },
    ],
  } as unknown as SeasonRepository;
  const sessionRepository = {
    create: async (
      _leagueId: string,
      _seasonId: string,
      input: { memberUserIds: string[] },
    ) => {
      createdMemberIds = input.memberUserIds;
      return {};
    },
  } as unknown as SessionRepository;

  return {
    service: new SessionService(
      leagueRepository,
      seasonRepository,
      sessionRepository,
      { rebuildSeason: async () => ({}) } as unknown as StatsRebuilder,
    ),
    getCreatedMemberIds: () => createdMemberIds,
  };
};

test("creates a sanma session with exactly three season members", async () => {
  const { service, getCreatedMemberIds } = makeService("sanma");

  await service.createSession("u1", "league-1", "season-1", {
    startedAt: "2026-01-01T00:00:00.000Z",
    memberUserIds: ["u1", "u2", "u3"],
    createdBy: "u1",
  });

  assert.deepEqual(getCreatedMemberIds(), ["u1", "u2", "u3"]);
});

test("rejects a sanma session with four members", async () => {
  const { service } = makeService("sanma");

  await assert.rejects(
    service.createSession("u1", "league-1", "season-1", {
      startedAt: "2026-01-01T00:00:00.000Z",
      memberUserIds: ["u1", "u2", "u3", "u4"],
      createdBy: "u1",
    }),
    (error: unknown) =>
      error instanceof Error &&
      error.message === "sanma sessions must have exactly 3 members",
  );
});

test("rejects duplicate session members before persistence", async () => {
  const { service } = makeService("yonma");

  await assert.rejects(
    service.createSession("u1", "league-1", "season-1", {
      startedAt: "2026-01-01T00:00:00.000Z",
      memberUserIds: ["u1", "u2", "u2", "u4"],
      createdBy: "u1",
    }),
    (error: unknown) =>
      error instanceof Error &&
      error.message === "session members must be unique",
  );
});
