import type { CreateSessionInput, UpdateSessionInput } from "@/domain/models.js";
import type { LeagueRepository } from "@/domain/repositories/leagueRepository.js";
import type { SeasonRepository } from "@/domain/repositories/seasonRepository.js";
import type { SessionRepository } from "@/domain/repositories/sessionRepository.js";
import { AppError, ValidationError } from "@/errors.js";

export class SessionService {
  constructor(
    private readonly leagueRepository: LeagueRepository,
    private readonly seasonRepository: SeasonRepository,
    private readonly sessionRepository: SessionRepository
  ) {}

  async listSessions(userId: string, leagueId: string, seasonId: string) {
    await this.assertSeasonMembership(userId, leagueId, seasonId);
    return this.sessionRepository.list(leagueId, seasonId);
  }

  async getSession(userId: string, leagueId: string, seasonId: string, sessionId: string) {
    await this.assertSeasonMembership(userId, leagueId, seasonId);
    return this.sessionRepository.get(leagueId, seasonId, sessionId);
  }

  async createSession(userId: string, leagueId: string, seasonId: string, input: CreateSessionInput) {
    await this.assertSeasonMembership(userId, leagueId, seasonId);
    const seasonMembers = await this.seasonRepository.listMembers(leagueId, seasonId);
    if (input.memberUserIds.length < 3 || input.memberUserIds.length > 4) {
      throw new ValidationError("sessions must have 3 or 4 members");
    }

    const memberMap = new Map(seasonMembers.map((member) => [member.userId, member]));
    const members = input.memberUserIds.map((memberId) => {
      const member = memberMap.get(memberId);
      if (!member) {
        throw new ValidationError("session members must belong to season", { userId: memberId });
      }
      return member;
    });

    return this.sessionRepository.create(leagueId, seasonId, input, members);
  }

  async updateSession(userId: string, leagueId: string, seasonId: string, sessionId: string, input: UpdateSessionInput) {
    await this.assertSeasonMembership(userId, leagueId, seasonId);
    return this.sessionRepository.update(leagueId, seasonId, sessionId, input);
  }

  async deleteSession(userId: string, leagueId: string, seasonId: string, sessionId: string) {
    await this.assertSeasonMembership(userId, leagueId, seasonId);
    await this.sessionRepository.delete(leagueId, seasonId, sessionId);
  }

  private async assertSeasonMembership(userId: string, leagueId: string, seasonId: string) {
    const leagueMembers = await this.leagueRepository.listMembers(leagueId);
    if (!leagueMembers.some((member) => member.userId === userId)) {
      throw new AppError("forbidden", 403, "forbidden", { leagueId });
    }

    const seasonMembers = await this.seasonRepository.listMembers(leagueId, seasonId);
    if (!seasonMembers.some((member) => member.userId === userId)) {
      throw new AppError("forbidden", 403, "forbidden", { leagueId, seasonId });
    }
  }
}
