import type {
  CreateLeagueInput,
  LeagueRepository,
  UpdateLeagueInput,
} from "@/domain/league/repository.js";
import { AppError, ValidationError } from "@/domain/shared/errors.js";
import { validateLeagueRule } from "@/domain/league/rule.js";
import type { UserRepository } from "@/domain/user/repository.js";
import type { StatsRebuilder } from "@/application/services/statsRebuilder.js";

export class LeagueService {
  constructor(
    private readonly leagueRepository: LeagueRepository,
    private readonly userRepository: UserRepository,
    private readonly statsRebuilder: StatsRebuilder,
  ) {}

  listLeagues(memberUserId: string) {
    return this.leagueRepository.list(memberUserId);
  }

  async getLeague(userId: string, leagueId: string) {
    await this.assertLeagueMembership(userId, leagueId);
    return this.leagueRepository.get(leagueId);
  }

  async listLeagueMembers(userId: string, leagueId: string) {
    await this.assertLeagueMembership(userId, leagueId);
    return this.leagueRepository.listMembers(leagueId);
  }

  async createLeague(ownerUserId: string, input: CreateLeagueInput) {
    validateLeagueRule(input.rule);
    const memberUserIds = [...new Set([ownerUserId, ...input.memberUserIds])];
    if (memberUserIds.length === 0) {
      throw new ValidationError("memberUserIds must not be empty");
    }
    const users = await this.userRepository.getByIds(memberUserIds);
    if (users.length !== memberUserIds.length) {
      throw new ValidationError("some memberUserIds were not found");
    }

    return this.leagueRepository.create({ ...input, memberUserIds });
  }

  async updateLeague(
    userId: string,
    leagueId: string,
    input: UpdateLeagueInput,
  ) {
    await this.assertLeagueMembership(userId, leagueId);
    if (input.rule !== undefined) {
      validateLeagueRule(input.rule);
    }

    const memberUserIds =
      input.memberUserIds === undefined
        ? undefined
        : [...new Set([userId, ...input.memberUserIds])];

    if (memberUserIds !== undefined) {
      const users = await this.userRepository.getByIds(memberUserIds);
      if (users.length !== memberUserIds.length) {
        throw new ValidationError("some memberUserIds were not found");
      }
    }

    return this.leagueRepository.update(leagueId, {
      ...input,
      memberUserIds,
    });
  }

  async deleteLeague(userId: string, leagueId: string) {
    await this.assertLeagueMembership(userId, leagueId);
    await this.leagueRepository.delete(leagueId);
    await this.statsRebuilder.clearLeagueStats(leagueId);
    await this.statsRebuilder.rebuildOverall();
  }

  async assertLeagueMembership(userId: string, leagueId: string) {
    const members = await this.leagueRepository.listMembers(leagueId);
    if (!members.some((member) => member.userId === userId)) {
      throw new AppError("forbidden", 403, "forbidden", { leagueId });
    }
  }
}
