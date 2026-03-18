import { calculateMatchPoints } from "@/domain/scoring.js";
import type { CreateMatchInput, UpdateMatchInput } from "@/domain/models.js";
import type { LeagueRepository } from "@/domain/repositories/leagueRepository.js";
import type { MatchRepository } from "@/domain/repositories/matchRepository.js";
import type { RuleRepository } from "@/domain/repositories/ruleRepository.js";
import type { SessionRepository } from "@/domain/repositories/sessionRepository.js";
import { AppError, ValidationError } from "@/errors.js";
import { StatsRebuilder } from "@/application/services/statsRebuilder.js";

export class MatchService {
  constructor(
    private readonly ruleRepository: RuleRepository,
    private readonly leagueRepository: LeagueRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly matchRepository: MatchRepository,
    private readonly statsRebuilder: StatsRebuilder
  ) {}

  async listMatches(userId: string, leagueId: string, seasonId: string, sessionId: string) {
    await this.assertSessionMembership(userId, leagueId, seasonId, sessionId);
    return this.matchRepository.list(leagueId, seasonId, sessionId);
  }

  async getMatch(userId: string, leagueId: string, seasonId: string, sessionId: string, matchId: string) {
    await this.assertSessionMembership(userId, leagueId, seasonId, sessionId);
    return this.matchRepository.get(leagueId, seasonId, sessionId, matchId);
  }

  async createMatch(userId: string, leagueId: string, seasonId: string, sessionId: string, input: CreateMatchInput) {
    await this.assertSessionMembership(userId, leagueId, seasonId, sessionId);
    const [league, session] = await Promise.all([
      this.leagueRepository.get(leagueId),
      this.sessionRepository.get(leagueId, seasonId, sessionId),
    ]);
    const rule = await this.ruleRepository.get(league.rule.id);
    const results = this.buildMatchResults(input.results, session.members, rule);

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

  async updateMatch(userId: string, leagueId: string, seasonId: string, sessionId: string, matchId: string, input: UpdateMatchInput) {
    await this.assertSessionMembership(userId, leagueId, seasonId, sessionId);
    const [league, session, existing] = await Promise.all([
      this.leagueRepository.get(leagueId),
      this.sessionRepository.get(leagueId, seasonId, sessionId),
      this.matchRepository.get(leagueId, seasonId, sessionId, matchId),
    ]);

    const rule = await this.ruleRepository.get(league.rule.id);
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

  async deleteMatch(userId: string, leagueId: string, seasonId: string, sessionId: string, matchId: string) {
    await this.assertSessionMembership(userId, leagueId, seasonId, sessionId);
    await this.matchRepository.delete(leagueId, seasonId, sessionId, matchId);
    await this.statsRebuilder.rebuildSeason(leagueId, seasonId);
  }

  private buildMatchResults(
    results: CreateMatchInput["results"],
    members: Array<{ userId: string; userName: string }>,
    rule: Awaited<ReturnType<RuleRepository["get"]>>
  ) {
    const memberNameByUserId = new Map(members.map((member) => [member.userId, member.userName]));
    return calculateMatchPoints(
      rule,
      results.map((result) => {
        const userName = memberNameByUserId.get(result.userId);
        if (!userName) {
          throw new ValidationError("result user must belong to session", { userId: result.userId });
        }

        return {
          ...result,
          userName,
        };
      })
    );
  }

  private async assertSessionMembership(userId: string, leagueId: string, seasonId: string, sessionId: string) {
    const league = await this.leagueRepository.listMembers(leagueId);
    if (!league.some((member) => member.userId === userId)) {
      throw new AppError("forbidden", 403, "forbidden", { leagueId });
    }

    const session = await this.sessionRepository.get(leagueId, seasonId, sessionId);
    if (!session.members.some((member) => member.userId === userId)) {
      throw new AppError("forbidden", 403, "forbidden", { leagueId, seasonId, sessionId });
    }
  }
}
