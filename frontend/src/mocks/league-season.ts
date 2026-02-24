import {
  leagueSeasonMembersData,
  leagueSeasonMembersData2,
  leagueSeasonMembersData3,
  leagueSeasonMembersData4,
} from "./league-season-member";

import { LeagueSeason, LeagueSeasonIdType } from "@/types/domain/league";

export const leagueSeasonData1: LeagueSeason = {
  leagueSeasonId: "0001",
  name: "2026シーズン春夏",
  members: leagueSeasonMembersData,
};

export const leagueSeasonData2: LeagueSeason = {
  leagueSeasonId: "0002",
  name: "2026シーズン秋冬",
  members: leagueSeasonMembersData2,
};

export const leagueSeasonsData: Record<LeagueSeasonIdType, LeagueSeason> = {
  [leagueSeasonData1.leagueSeasonId]: leagueSeasonData1,
  [leagueSeasonData2.leagueSeasonId]: leagueSeasonData2,
};

export const leagueSeasonData3: LeagueSeason = {
  leagueSeasonId: "0003",
  name: "レギュラーシーズン",
  members: leagueSeasonMembersData3,
};

export const leagueSeasonData4: LeagueSeason = {
  leagueSeasonId: "0004",
  name: "ファイナルシーズン",
  members: leagueSeasonMembersData4,
};

export const leagueSeasonsData2: Record<LeagueSeasonIdType, LeagueSeason> = {
  [leagueSeasonData3.leagueSeasonId]: leagueSeasonData3,
  [leagueSeasonData4.leagueSeasonId]: leagueSeasonData4,
};
