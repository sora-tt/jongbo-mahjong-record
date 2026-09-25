import {
  toId,
  toIsoDateTime,
  type ApiSeason,
  type ApiSeasonSummary,
} from "@/lib/api/contracts";

export const toSeasonSummary = (dto: ApiSeasonSummary) => ({
  ...dto,
  id: toId(dto.id, "season.id"),
  leagueId: toId(dto.leagueId, "season.leagueId"),
  createdAt: toIsoDateTime(dto.createdAt),
  updatedAt: toIsoDateTime(dto.updatedAt),
});

export const toSeasonDetail = (dto: ApiSeason) => ({
  ...dto,
  id: toId(dto.id, "season.id"),
  leagueId: toId(dto.leagueId, "season.leagueId"),
  createdAt: toIsoDateTime(dto.createdAt),
  updatedAt: toIsoDateTime(dto.updatedAt),
  latestPlayedAt: dto.latestPlayedAt ? toIsoDateTime(dto.latestPlayedAt) : null,
});
