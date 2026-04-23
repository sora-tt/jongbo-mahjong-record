import { getDb } from "@/infrastructure/firestore/client.js";
import { FirestoreLeagueRepository } from "@/infrastructure/firestore/repositories/leagueRepository.js";
import { FirestoreMatchRepository } from "@/infrastructure/firestore/repositories/matchRepository.js";
import { FirestoreRuleRepository } from "@/infrastructure/firestore/repositories/ruleRepository.js";
import { FirestoreSeasonRepository } from "@/infrastructure/firestore/repositories/seasonRepository.js";
import { FirestoreSessionRepository } from "@/infrastructure/firestore/repositories/sessionRepository.js";
import { FirestoreUserRepository } from "@/infrastructure/firestore/repositories/userRepository.js";
import { FirestoreUserStatsRepository } from "@/infrastructure/firestore/repositories/userStatsRepository.js";
import { LeagueService } from "@/application/services/leagueService.js";
import { MatchService } from "@/application/services/matchService.js";
import { AuthService } from "@/application/services/authService.js";
import { RuleService } from "@/application/services/ruleService.js";
import { SeasonService } from "@/application/services/seasonService.js";
import { SessionService } from "@/application/services/sessionService.js";
import { StatsRebuilder } from "@/application/services/statsRebuilder.js";
import { UserService } from "@/application/services/userService.js";

export type Services = ReturnType<typeof createDependencies>["services"];

export const createDependencies = () => {
  const db = getDb();

  const userRepository = new FirestoreUserRepository(db);
  const ruleRepository = new FirestoreRuleRepository(db);
  const leagueRepository = new FirestoreLeagueRepository(db, userRepository);
  const seasonRepository = new FirestoreSeasonRepository(db);
  const sessionRepository = new FirestoreSessionRepository(db);
  const matchRepository = new FirestoreMatchRepository(db);
  const userStatsRepository = new FirestoreUserStatsRepository(db);
  const statsRebuilder = new StatsRebuilder(
    leagueRepository,
    seasonRepository,
    sessionRepository,
    matchRepository,
    userStatsRepository,
  );

  return {
    services: {
      authService: new AuthService(userRepository),
      ruleService: new RuleService(ruleRepository),
      userService: new UserService(userRepository, userStatsRepository),
      leagueService: new LeagueService(
        leagueRepository,
        ruleRepository,
        userRepository,
      ),
      seasonService: new SeasonService(
        leagueRepository,
        seasonRepository,
        matchRepository,
      ),
      sessionService: new SessionService(
        leagueRepository,
        seasonRepository,
        sessionRepository,
      ),
      matchService: new MatchService(
        ruleRepository,
        leagueRepository,
        sessionRepository,
        matchRepository,
        statsRebuilder,
      ),
    },
  };
};
