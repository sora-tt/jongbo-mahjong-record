import { leagueSeasonMembersData } from "./league-season-member";

import { LeagueSeason, LeagueSeasonIdType } from "@/types/domain/league";

export const leagueSeasonData1: LeagueSeason = {
  leagueSeasonId: "0001",
  name: "2026シーズン春夏",
  members: leagueSeasonMembersData,
};

export const leagueSeasonData2: LeagueSeason = {
  leagueSeasonId: "0001",
  name: "2026シーズン秋冬",
  members: leagueSeasonMembersData,
};

export const leagueSeasonsData: Record<LeagueSeasonIdType, LeagueSeason> = {
  [leagueSeasonData1.leagueSeasonId]: leagueSeasonData1,
  [leagueSeasonData2.leagueSeasonId]: leagueSeasonData2,
};
