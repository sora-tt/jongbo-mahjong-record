import type { LeagueRepository } from "@/domain/league/repository.js";
import type { SeasonRepository } from "@/domain/season/repository.js";
import type {
  CreateSessionInput,
  SessionRepository,
  UpdateSessionInput,
} from "@/domain/session/repository.js";
import { AppError, ValidationError } from "@/domain/shared/errors.js";
import { asOpaqueId } from "@/domain/shared/types.js";

export class SessionService {
  constructor(
    private readonly leagueRepository: LeagueRepository,
    private readonly seasonRepository: SeasonRepository,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async listSessions(userId: string, leagueId: string, seasonId: string) {
    await this.assertSeasonMembership(userId, leagueId, seasonId);
    return this.sessionRepository.list(leagueId, seasonId);
  }

  async getSession(
    userId: string,
    leagueId: string,
    seasonId: string,
    sessionId: string,
  ) {
    await this.assertSeasonMembership(userId, leagueId, seasonId);
    return this.sessionRepository.get(leagueId, seasonId, sessionId);
  }

  async createSession(
    userId: string,
    leagueId: string,
    seasonId: string,
    input: CreateSessionInput,
  ) {
    await this.assertSeasonMembership(userId, leagueId, seasonId);
    const [seasonMembers, rule] = await Promise.all([
      this.seasonRepository.listMembers(leagueId, seasonId),
      this.leagueRepository.getRule(leagueId),
    ]);
    const expectedMemberCount = rule.gameType === "sanma" ? 3 : 4;
    if (input.memberUserIds.length !== expectedMemberCount) {
      throw new ValidationError(
        `${rule.gameType} sessions must have exactly ${expectedMemberCount} members`,
        {
          field: "memberUserIds",
          gameType: rule.gameType,
          expectedMemberCount,
          actualMemberCount: input.memberUserIds.length,
        },
      );
    }
    if (new Set(input.memberUserIds).size !== input.memberUserIds.length) {
      throw new ValidationError("session members must be unique", {
        field: "memberUserIds",
      });
    }

    const memberMap = new Map(
      seasonMembers.map((member) => [member.userId, member]),
    );
    const members = input.memberUserIds.map((memberId) => {
      const member = memberMap.get(asOpaqueId(memberId));
      if (!member) {
        throw new ValidationError("session members must belong to season", {
          userId: memberId,
        });
      }
      return member;
    });

    return this.sessionRepository.create(leagueId, seasonId, input, members);
  }

  async updateSession(
    userId: string,
    leagueId: string,
    seasonId: string,
    sessionId: string,
    input: UpdateSessionInput,
  ) {
    await this.assertSeasonMembership(userId, leagueId, seasonId);
    return this.sessionRepository.update(leagueId, seasonId, sessionId, input);
  }

  async deleteSession(
    userId: string,
    leagueId: string,
    seasonId: string,
    sessionId: string,
  ) {
    await this.assertSeasonMembership(userId, leagueId, seasonId);
    await this.sessionRepository.delete(leagueId, seasonId, sessionId);
  }

  private async assertSeasonMembership(
    userId: string,
    leagueId: string,
    seasonId: string,
  ) {
    const leagueMembers = await this.leagueRepository.listMembers(leagueId);
    if (!leagueMembers.some((member) => member.userId === userId)) {
      throw new AppError("forbidden", 403, "forbidden", { leagueId });
    }

    const seasonMembers = await this.seasonRepository.listMembers(
      leagueId,
      seasonId,
    );
    if (!seasonMembers.some((member) => member.userId === userId)) {
      throw new AppError("forbidden", 403, "forbidden", { leagueId, seasonId });
    }
  }
}
