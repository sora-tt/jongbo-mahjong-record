import {
  toId,
  toIsoDateTime,
  type ApiSession,
  type ApiSessionList,
} from "@/lib/api/contracts";

export const toSession = (dto: ApiSession) => ({
  ...dto,
  id: toId(dto.id, "session.id"),
  leagueId: toId(dto.leagueId, "session.leagueId"),
  seasonId: toId(dto.seasonId, "session.seasonId"),
  startedAt: toIsoDateTime(dto.startedAt),
  endedAt: dto.endedAt ? toIsoDateTime(dto.endedAt) : null,
  createdBy: toId(dto.createdBy, "session.createdBy"),
  createdAt: toIsoDateTime(dto.createdAt),
  updatedAt: toIsoDateTime(dto.updatedAt),
});

export const toSessionList = (dtos: ApiSessionList) => dtos.map(toSession);
