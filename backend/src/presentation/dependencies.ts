import { getDb } from "@/infrastructure/firestore/client.js";
import { FirestoreLeagueRepository } from "@/infrastructure/firestore/repositories/leagueRepository.js";
import { FirestoreMatchRepository } from "@/infrastructure/firestore/repositories/matchRepository.js";
import { FirestoreSeasonRepository } from "@/infrastructure/firestore/repositories/seasonRepository.js";
import { FirestoreSessionRepository } from "@/infrastructure/firestore/repositories/sessionRepository.js";
import { FirestoreUserRepository } from "@/infrastructure/firestore/repositories/userRepository.js";
import { FirestoreUserStatsRepository } from "@/infrastructure/firestore/repositories/userStatsRepository.js";
import { FirestoreUserMatchStatisticsRepository } from "@/infrastructure/firestore/repositories/userMatchStatisticsRepository.js";
import { LeagueService } from "@/application/services/leagueService.js";
import { MatchService } from "@/application/services/matchService.js";
import { AuthService } from "@/application/services/authService.js";
import { SeasonService } from "@/application/services/seasonService.js";
import { SessionService } from "@/application/services/sessionService.js";
import { StatsRebuilder } from "@/application/services/statsRebuilder.js";
import { PersonalStatisticsAnalysisReader } from "@/application/services/personalStatisticsAnalysisReader.js";
import { PersonalStatisticsMatchHistoryReader } from "@/application/services/personalStatisticsMatchHistoryReader.js";
import { PersonalStatisticsSummaryReader } from "@/application/services/personalStatisticsSummaryReader.js";
import { StatisticsTargetAccessService } from "@/application/services/statisticsTargetAccessService.js";
import { UserService } from "@/application/services/userService.js";
import type { LeagueRepository } from "@/domain/league/repository.js";
import type { SeasonRepository } from "@/domain/season/repository.js";
import type { UserMatchStatisticsRepository } from "@/domain/statistics/repository.js";
import type { UserStatsRepository } from "@/domain/user/repository.js";

export type Services = ReturnType<typeof createDependencies>["services"];

type StatisticsServiceRepositories = {
  leagueRepository: Pick<LeagueRepository, "get" | "areMembers">;
  seasonRepository: Pick<SeasonRepository, "get" | "areMembers">;
  userStatsRepository: Pick<UserStatsRepository, "getWithPersonalStatistics">;
  userMatchStatisticsRepository: Pick<
    UserMatchStatisticsRepository,
    "listForScope" | "listPage"
  >;
};

export const createStatisticsServices = ({
  leagueRepository,
  seasonRepository,
  userStatsRepository,
  userMatchStatisticsRepository,
}: StatisticsServiceRepositories) => {
  const statisticsTargetAccessService = new StatisticsTargetAccessService(
    leagueRepository,
    seasonRepository,
  );

  return {
    statisticsTargetAccessService,
    personalStatisticsSummaryReader: new PersonalStatisticsSummaryReader(
      statisticsTargetAccessService,
      userStatsRepository,
      userMatchStatisticsRepository,
      leagueRepository,
      seasonRepository,
    ),
    personalStatisticsAnalysisReader: new PersonalStatisticsAnalysisReader(
      statisticsTargetAccessService,
      userStatsRepository,
      userMatchStatisticsRepository,
      leagueRepository,
      seasonRepository,
    ),
    personalStatisticsMatchHistoryReader:
      new PersonalStatisticsMatchHistoryReader(
        statisticsTargetAccessService,
        userStatsRepository,
        userMatchStatisticsRepository,
        leagueRepository,
        seasonRepository,
      ),
  };
};

export const createDependencies = () => {
  const db = getDb();

  const userRepository = new FirestoreUserRepository(db);
  const leagueRepository = new FirestoreLeagueRepository(db, userRepository);
  const seasonRepository = new FirestoreSeasonRepository(db);
  const sessionRepository = new FirestoreSessionRepository(db);
  const matchRepository = new FirestoreMatchRepository(db);
  const userStatsRepository = new FirestoreUserStatsRepository(db);
  const userMatchStatisticsRepository =
    new FirestoreUserMatchStatisticsRepository(db);
  const statsRebuilder = new StatsRebuilder(
    leagueRepository,
    seasonRepository,
    sessionRepository,
    matchRepository,
    userStatsRepository,
    userMatchStatisticsRepository,
  );
  const statisticsServices = createStatisticsServices({
    leagueRepository,
    seasonRepository,
    userStatsRepository,
    userMatchStatisticsRepository,
  });

  return {
    statsRebuilder,
    services: {
      authService: new AuthService(userRepository),
      userService: new UserService(userRepository, userStatsRepository),
      leagueService: new LeagueService(
        leagueRepository,
        userRepository,
        statsRebuilder,
      ),
      seasonService: new SeasonService(
        leagueRepository,
        seasonRepository,
        matchRepository,
        statsRebuilder,
      ),
      sessionService: new SessionService(
        leagueRepository,
        seasonRepository,
        sessionRepository,
        statsRebuilder,
      ),
      matchService: new MatchService(
        leagueRepository,
        seasonRepository,
        sessionRepository,
        matchRepository,
        statsRebuilder,
      ),
      ...statisticsServices,
    },
  };
};
