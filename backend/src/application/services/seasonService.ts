import type { LeagueRepository } from "@/domain/league/repository.js";
import type { MatchRepository } from "@/domain/match/repository.js";
import type {
  CreateSeasonInput,
  SeasonRepository,
  UpdateSeasonInput,
} from "@/domain/season/repository.js";
import {
  AppError,
  ConflictError,
  ValidationError,
} from "@/domain/shared/errors.js";

export class SeasonService {
  constructor(
    private readonly leagueRepository: LeagueRepository,
    private readonly seasonRepository: SeasonRepository,
    private readonly matchRepository: MatchRepository,
  ) {}

  async listSeasons(userId: string, leagueId: string) {
    await this.assertLeagueMembership(userId, leagueId);
    return this.seasonRepository.list(leagueId);
  }

  async getSeason(userId: string, leagueId: string, seasonId: string) {
    await this.assertSeasonMembership(userId, leagueId, seasonId);
    const [season, matches] = await Promise.all([
      this.seasonRepository.get(leagueId, seasonId),
      this.matchRepository.listBySeason(leagueId, seasonId),
    ]);

    const latestPlayedAt =
      matches.length === 0
        ? null
        : [...matches].sort(
            (left, right) =>
              new Date(right.playedAt).getTime() -
              new Date(left.playedAt).getTime(),
          )[0].playedAt;

    return {
      ...season,
      latestPlayedAt,
    };
  }

  async listSeasonMembers(userId: string, leagueId: string, seasonId: string) {
    await this.assertSeasonMembership(userId, leagueId, seasonId);
    return this.seasonRepository.listMembers(leagueId, seasonId);
  }

  async createSeason(
    userId: string,
    leagueId: string,
    input: CreateSeasonInput,
  ) {
    await this.assertLeagueMembership(userId, leagueId);
    if (input.memberUserIds.length === 0) {
      throw new ValidationError("memberUserIds must not be empty");
    }

    const leagueMembers = await this.leagueRepository.listMembers(leagueId);
    const leagueMemberMap = new Map(
      leagueMembers.map((member) => [member.userId, member]),
    );
    const members = input.memberUserIds.map((userIdValue) => {
      const member = leagueMemberMap.get(userIdValue);
      if (!member) {
        throw new ValidationError("memberUserIds must be league members", {
          userId: userIdValue,
        });
      }
      return {
        userId: member.userId,
        userName: member.userName,
      };
    });

    if ((input.status ?? "active") === "active") {
      const activeSeason =
        await this.seasonRepository.findActiveSeason(leagueId);
      if (activeSeason) {
        throw new ConflictError("active season already exists", {
          activeSeasonId: activeSeason.id,
        });
      }
    }

    return this.seasonRepository.create(leagueId, input, members);
  }

  async updateSeason(
    userId: string,
    leagueId: string,
    seasonId: string,
    input: UpdateSeasonInput,
  ) {
    await this.assertSeasonMembership(userId, leagueId, seasonId);
    if (input.status === "active") {
      const activeSeason =
        await this.seasonRepository.findActiveSeason(leagueId);
      if (activeSeason && activeSeason.id !== seasonId) {
        throw new ConflictError("active season already exists", {
          activeSeasonId: activeSeason.id,
        });
      }
    }

    return this.seasonRepository.update(leagueId, seasonId, input);
  }

  async deleteSeason(userId: string, leagueId: string, seasonId: string) {
    await this.assertSeasonMembership(userId, leagueId, seasonId);
    await this.seasonRepository.delete(leagueId, seasonId);
  }

  private async assertLeagueMembership(userId: string, leagueId: string) {
    const members = await this.leagueRepository.listMembers(leagueId);
    if (!members.some((member) => member.userId === userId)) {
      throw new AppError("forbidden", 403, "forbidden", { leagueId });
    }
  }

  private async assertSeasonMembership(
    userId: string,
    leagueId: string,
    seasonId: string,
  ) {
    await this.assertLeagueMembership(userId, leagueId);
    const members = await this.seasonRepository.listMembers(leagueId, seasonId);
    if (!members.some((member) => member.userId === userId)) {
      throw new AppError("forbidden", 403, "forbidden", { leagueId, seasonId });
    }
  }
}
