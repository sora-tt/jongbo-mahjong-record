// src/app/league/hooks/index.ts
import * as React from "react";

import { mockLeagueDetails } from "@/mocks/league-detail";
import { mockUser } from "@/mocks/user";

type LeagueRaw = (typeof mockLeagueDetails)[number];

type LeagueView = {
  id: string;
  name: string;
  createdAt: Date;
  lastRecordedAt: Date;
  ruleName: string;
  totalGames: number;
  standings: LeagueRaw["standings"];
  members: LeagueRaw["members"];
  titles: LeagueRaw["titles"];
  raw: LeagueRaw; // 必要なら元データも保持
};

const toLeagueView = (league: LeagueRaw): LeagueView => {
  return {
    id: league.id,
    name: league.name,
    createdAt: league.createdAt,
    lastRecordedAt: league.lastRecordedAt,
    ruleName: league.ruleName,
    totalGames: league.totalGames,
    standings: league.standings,
    members: league.members,
    titles: league.titles,
    raw: league,
  };
};

export const useLeague = () => {
  const user = mockUser;

  const targetLeagueId = "league1";
  const leagueRaw =
    mockLeagueDetails.find((l) => l.id === targetLeagueId) ?? null;

  const league = React.useMemo(
    () => (leagueRaw ? toLeagueView(leagueRaw) : null),
    [leagueRaw]
  );

  const error: string | null = league ? null : "リーグが見つかりません";

  return { user, league, error };
};
