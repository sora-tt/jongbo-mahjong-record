import assert from "node:assert/strict";
import test from "node:test";
import type { LeagueRepository } from "@/domain/league/repository.js";
import type { SeasonRepository } from "@/domain/season/repository.js";
import type { UserMatchStatisticsRepository } from "@/domain/statistics/repository.js";
import type { UserStatsRepository } from "@/domain/user/repository.js";
import type { LeagueId, UserId } from "@/domain/shared/types.js";
import { createStatisticsServices } from "@/presentation/dependencies.js";

const getDependency = <T>(instance: object, key: string): T =>
  Reflect.get(instance, key) as T;

const createRepositories = () => {
  const membershipCalls: Array<[string, string, string]> = [];
  const leagueRepository = {
    get: async () => ({}),
    exists: async () => true,
    areMembers: async (
      leagueId: string,
      viewerUserId: string,
      targetUserId: string,
    ) => {
      membershipCalls.push([leagueId, viewerUserId, targetUserId]);
      return true;
    },
  } as unknown as Pick<LeagueRepository, "get" | "exists" | "areMembers">;
  const seasonRepository = {
    get: async () => ({}),
    exists: async () => true,
    areMembers: async () => true,
  } as unknown as Pick<SeasonRepository, "get" | "exists" | "areMembers">;
  const userStatsRepository = {
    getWithPersonalStatistics: async () => null,
  } as unknown as Pick<UserStatsRepository, "getWithPersonalStatistics">;
  const projectionRepository = {
    listForScope: async () => [],
    listPage: async () => ({ status: "empty", items: [], nextCursor: null }),
  } as unknown as Pick<
    UserMatchStatisticsRepository,
    "listForScope" | "listPage"
  >;

  return {
    leagueRepository,
    seasonRepository,
    userStatsRepository,
    userMatchStatisticsRepository: projectionRepository,
    membershipCalls,
  };
};

test("statistics readers share the access service and repositories", () => {
  const repositories = createRepositories();
  const services = createStatisticsServices(repositories);

  assert.equal(
    getDependency(services.personalStatisticsSummaryReader, "accessService"),
    services.statisticsTargetAccessService,
  );
  assert.equal(
    getDependency(services.personalStatisticsAnalysisReader, "accessService"),
    services.statisticsTargetAccessService,
  );
  assert.equal(
    getDependency(
      services.personalStatisticsMatchHistoryReader,
      "accessService",
    ),
    services.statisticsTargetAccessService,
  );

  for (const reader of [
    services.personalStatisticsSummaryReader,
    services.personalStatisticsAnalysisReader,
    services.personalStatisticsMatchHistoryReader,
  ]) {
    assert.equal(
      getDependency(reader, "userStatsRepository"),
      repositories.userStatsRepository,
    );
    assert.equal(
      getDependency(reader, "leagueRepository"),
      repositories.leagueRepository,
    );
    assert.equal(
      getDependency(reader, "seasonRepository"),
      repositories.seasonRepository,
    );
  }

  assert.equal(
    getDependency(
      services.personalStatisticsSummaryReader,
      "projectionRepository",
    ),
    repositories.userMatchStatisticsRepository,
  );
  assert.equal(
    getDependency(
      services.personalStatisticsAnalysisReader,
      "projectionRepository",
    ),
    repositories.userMatchStatisticsRepository,
  );
  assert.equal(
    getDependency(
      services.personalStatisticsMatchHistoryReader,
      "projectionRepository",
    ),
    repositories.userMatchStatisticsRepository,
  );
});

test("summary reader keeps authenticated viewer and path target identities separate", async () => {
  const repositories = createRepositories();
  const services = createStatisticsServices(repositories);

  const result = await services.personalStatisticsSummaryReader.getSummary({
    scopeType: "league",
    leagueId: "league-1" as LeagueId,
    viewerUserId: "authenticated-viewer" as UserId,
    targetUserId: "path-target" as UserId,
  });

  assert.equal(result.status, "uncomputed");
  assert.deepEqual(repositories.membershipCalls, [
    ["league-1", "authenticated-viewer", "path-target"],
  ]);
});
