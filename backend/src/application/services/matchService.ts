import type { LeagueRepository } from "@/domain/league/repository.js";
import type {
  CreateMatchInput,
  MatchRepository,
  UpdateMatchInput,
} from "@/domain/match/repository.js";
import { calculateMatchPoints } from "@/domain/shared/scoring.js";
import { AppError, ValidationError } from "@/domain/shared/errors.js";
import type { SeasonRepository } from "@/domain/season/repository.js";
import type { SessionRepository } from "@/domain/session/repository.js";
import { StatsRebuilder } from "@/application/services/statsRebuilder.js";

export const validateMatchParticipants = (
  results: Array<{ userId: string }>,
  members: Array<{ userId: string }>,
) => {
  const memberUserIds = new Set(members.map((member) => member.userId));
  const resultUserIds = new Set(results.map((result) => result.userId));
  if (
    resultUserIds.size !== results.length ||
    members.length !== results.length ||
    resultUserIds.size !== memberUserIds.size ||
    results.some((result) => !memberUserIds.has(result.userId))
  ) {
    throw new ValidationError("match participants must match session members", {
      field: "results.userId",
      expectedUserIds: [...memberUserIds],
      actualUserIds: [...resultUserIds],
    });
  }
};

export class MatchService {
  constructor(
    private readonly leagueRepository: LeagueRepository,
    private readonly seasonRepository: SeasonRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly matchRepository: MatchRepository,
    private readonly statsRebuilder: StatsRebuilder,
  ) {}

  async listMatches(
    userId: string,
    leagueId: string,
    seasonId: string,
    sessionId: string,
  ) {
    await this.assertSeasonMembership(userId, leagueId, seasonId);
    return this.matchRepository.list(leagueId, seasonId, sessionId);
  }

  async getMatch(
    userId: string,
    leagueId: string,
    seasonId: string,
    sessionId: string,
    matchId: string,
  ) {
    await this.assertSeasonMembership(userId, leagueId, seasonId);
    return this.matchRepository.get(leagueId, seasonId, sessionId, matchId);
  }

  async createMatch(
    userId: string,
    leagueId: string,
    seasonId: string,
    sessionId: string,
    input: CreateMatchInput,
  ) {
    await this.assertSeasonMembership(userId, leagueId, seasonId);
    const [rule, session] = await Promise.all([
      this.leagueRepository.getRule(leagueId),
      this.sessionRepository.get(leagueId, seasonId, sessionId),
    ]);
    const results = this.buildMatchResults(
      input.results,
      session.members,
      rule,
    );

    const match = await this.matchRepository.create({
      leagueId,
      seasonId,
      sessionId,
      playedAt: input.playedAt,
      results,
    });
    await this.statsRebuilder.rebuildSeason(leagueId, seasonId);
    return match;
  }

  async updateMatch(
    userId: string,
    leagueId: string,
    seasonId: string,
    sessionId: string,
    matchId: string,
    input: UpdateMatchInput,
  ) {
    await this.assertSeasonMembership(userId, leagueId, seasonId);
    const [rule, session, existing] = await Promise.all([
      this.leagueRepository.getRule(leagueId),
      this.sessionRepository.get(leagueId, seasonId, sessionId),
      this.matchRepository.get(leagueId, seasonId, sessionId, matchId),
    ]);

    const nextResults =
      input.results === undefined
        ? undefined
        : this.buildMatchResults(input.results, session.members, rule);

    const updated = await this.matchRepository.update({
      leagueId,
      seasonId,
      sessionId,
      matchId,
      playedAt: input.playedAt ?? existing.playedAt,
      results: nextResults,
    });
    await this.statsRebuilder.rebuildSeason(leagueId, seasonId);
    return updated;
  }

  async deleteMatch(
    userId: string,
    leagueId: string,
    seasonId: string,
    sessionId: string,
    matchId: string,
  ) {
    await this.assertSeasonMembership(userId, leagueId, seasonId);
    await this.matchRepository.delete(leagueId, seasonId, sessionId, matchId);
    await this.statsRebuilder.rebuildSeason(leagueId, seasonId);
  }

  private buildMatchResults(
    results: CreateMatchInput["results"],
    members: Array<{ userId: string; userName: string }>,
    rule: Awaited<ReturnType<LeagueRepository["getRule"]>>,
  ) {
    validateMatchParticipants(results, members);
    const memberNameByUserId = new Map(
      members.map((member) => [member.userId, member.userName]),
    );
    return calculateMatchPoints(
      rule,
      results.map((result) => {
        const userName = memberNameByUserId.get(result.userId);
        if (!userName) {
          throw new ValidationError("result user must belong to session", {
            userId: result.userId,
          });
        }

        return {
          ...result,
          userName,
        };
      }),
    );
  }

  private async assertSeasonMembership(
    userId: string,
    leagueId: string,
    seasonId: string,
  ) {
    const members = await this.seasonRepository.listMembers(leagueId, seasonId);
    if (!members.some((member) => member.userId === userId)) {
      throw new AppError("forbidden", 403, "forbidden", { leagueId, seasonId });
    }
  }
}
