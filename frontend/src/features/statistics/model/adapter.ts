import {
  toId,
  toIsoDateTime,
  type ApiJoiningSeason,
  type ApiSeason,
  type ApiUserStats,
} from "@/lib/api/contracts";

export const toUserStats = (dto: ApiUserStats) => ({
  ...dto,
  id: toId(dto.id, "userStats.id"),
  userId: toId(dto.userId, "userStats.userId"),
  leagueId: dto.leagueId ? toId(dto.leagueId, "userStats.leagueId") : null,
  seasonId: dto.seasonId ? toId(dto.seasonId, "userStats.seasonId") : null,
  createdAt: toIsoDateTime(dto.createdAt),
  updatedAt: toIsoDateTime(dto.updatedAt),
});

export const toJoiningSeason = (dto: ApiJoiningSeason) => ({
  ...dto,
  leagueId: toId(dto.leagueId, "joiningSeason.leagueId"),
  seasonId: toId(dto.seasonId, "joiningSeason.seasonId"),
});

export const toStandingRows = (standings: ApiSeason["standings"]) =>
  standings.map((standing) => ({
    ...standing,
    userId: toId(standing.userId, "standing.userId"),
  }));

export const toPointProgressionChart = (
  progressions: ApiSeason["pointProgressions"],
  totalMatchCount?: number
) => {
  const series = progressions.map((progression) => ({
    userId: toId(progression.userId, "pointProgression.userId"),
    userName: progression.userName,
  }));
  const matchIndexes = Array.from(
    new Set(
      progressions.flatMap((progression) =>
        progression.points.map((point) => point.matchIndex)
      )
    )
  );

  const data = matchIndexes.map((matchIndex) => {
    const row: { matchIndex: number; [userId: string]: number | null } = {
      matchIndex,
    };

    progressions.forEach((progression) => {
      const point = progression.points.find(
        (candidate) => candidate.matchIndex === matchIndex
      );
      row[String(progression.userId)] = point?.totalPoints ?? null;
    });

    return row;
  });

  return {
    series,
    data,
    isEmpty: series.length === 0 || data.length === 0,
    isUncomputed:
      data.length === 0 &&
      (totalMatchCount === undefined ? series.length > 0 : totalMatchCount > 0),
  };
};
