import {
  toId,
  toIsoDateTime,
  type ApiMatch,
  type ApiMatchDetail,
} from "@/lib/api/contracts";

export const toMatch = (dto: ApiMatch | ApiMatchDetail) => ({
  ...dto,
  id: toId(dto.id, "match.id"),
  leagueId: toId(dto.leagueId, "match.leagueId"),
  seasonId: toId(dto.seasonId, "match.seasonId"),
  sessionId: toId(dto.sessionId, "match.sessionId"),
  playedAt: toIsoDateTime(dto.playedAt),
  createdAt: toIsoDateTime(dto.createdAt),
  updatedAt: toIsoDateTime(dto.updatedAt),
});

export const toMatchList = (dtos: ReadonlyArray<ApiMatch>) => dtos.map(toMatch);
