import {
  toId,
  toIsoDateTime,
  type ApiLeague,
  type ApiLeagueListItem,
} from "@/lib/api/contracts";

const adaptActiveSeason = (activeSeason: ApiLeagueListItem["activeSeason"]) =>
  activeSeason
    ? {
        ...activeSeason,
        id: toId(activeSeason.id, "activeSeason.id"),
      }
    : null;

export const toLeagueSummary = (dto: ApiLeagueListItem) => ({
  ...dto,
  id: toId(dto.id, "league.id"),
  activeSeason: adaptActiveSeason(dto.activeSeason),
  createdAt: toIsoDateTime(dto.createdAt),
  updatedAt: toIsoDateTime(dto.updatedAt),
});

export const toLeagueDetail = (dto: ApiLeague) => ({
  ...dto,
  id: toId(dto.id, "league.id"),
  activeSeason: adaptActiveSeason(dto.activeSeason),
  createdAt: toIsoDateTime(dto.createdAt),
  updatedAt: toIsoDateTime(dto.updatedAt),
});
