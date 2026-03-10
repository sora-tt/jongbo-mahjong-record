import { leagueMembersData } from "./league-member";
import { leagueRecordData1 } from "./league-record";
import { leagueSeasonsData, leagueSeasonsData2 } from "./league-season";
import { ruleData1 } from "./rule";

import { League, LeagueIdType } from "@/types/domain/league";
import { AppDate } from "@/types/utils/app-date";

export const leagueData1: League = {
  leagueId: "000000",
  name: "雀望リーグ",
  createdAt: AppDate.fromYMD({
    year: 2000,
    month: 9,
    day: 4,
  }),
  rule: ruleData1,
  members: leagueMembersData,
  seasons: leagueSeasonsData,
  lastRecordedAt: AppDate.fromYMD({
    year: 2025,
    month: 11,
    day: 9,
  }),
  leagueRecord: leagueRecordData1,
  totalGames: 242,
  titles: [
    { label: "最高得点", playerName: "水島", value: "87800点" },
    { label: "ラス回避率", playerName: "梶本", value: "85.71%" },
    { label: "連対率", playerName: "川上", value: "57.89%" },
  ],
};

export const leagueData2: League = {
  leagueId: "000001",
  name: "土田リーグ",
  createdAt: AppDate.fromYMD({
    year: 2000,
    month: 9,
    day: 4,
  }),
  rule: ruleData1,
  members: leagueMembersData,
  seasons: leagueSeasonsData2,
  lastRecordedAt: AppDate.fromYMD({
    year: 2025,
    month: 11,
    day: 9,
  }),
  totalGames: 242,
  leagueRecord: leagueRecordData1,
  titles: [
    { label: "最高得点", playerName: "水島", value: "87800点" },
    { label: "ラス回避率", playerName: "梶本", value: "85.71%" },
    { label: "連対率", playerName: "川上", value: "57.89%" },
  ],
};

export const leaguesData: Record<LeagueIdType, League> = {
  [leagueData1.leagueId]: leagueData1,
  [leagueData2.leagueId]: leagueData2,
};
