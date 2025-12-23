import { leagueMembersData } from "./league-member";

import { League } from "@/types/domain/league";

export const leagueData1: League = {
  id: "000000",
  name: "雀望リーグ",
  createdAt: new Date(2000, 9, 3),
  members: leagueMembersData,
  lastRecordedAt: new Date(2025, 10, 9),
  ruleName: "Mリーグルール",
  totalGames: 242,
  titles: [
    { label: "最高得点", playerName: "水島", value: "87800点" },
    { label: "ラス回避率", playerName: "梶本", value: "85.71%" },
    { label: "連対率", playerName: "川上", value: "57.89%" },
  ],
};

export const leagueData2: League = {
  id: "000001",
  name: "土田リーグ",
  createdAt: new Date(2000, 9, 4),
  members: leagueMembersData,
  lastRecordedAt: new Date(2025, 10, 9),
  ruleName: "Mリーグルール",
  totalGames: 242,
  titles: [
    { label: "最高得点", playerName: "水島", value: "87800点" },
    { label: "ラス回避率", playerName: "梶本", value: "85.71%" },
    { label: "連対率", playerName: "川上", value: "57.89%" },
  ],
};

export const leaguesData: League[] = [leagueData1, leagueData2];
