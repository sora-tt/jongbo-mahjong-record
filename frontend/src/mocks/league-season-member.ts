import {
  userData1,
  userData2,
  userData3,
  userData4,
  userData5,
  userData6,
  userData7,
  userData8,
  userData9,
} from "./user";

import { LeagueSeasonMember } from "@/types/domain/league";
import { UserIdType } from "@/types/domain/user";

export const leagueSeasonMemberData1: LeagueSeasonMember = {
  player: userData1,
};

export const leagueSeasonMemberData2: LeagueSeasonMember = {
  player: userData2,
};

export const leagueSeasonMemberData3: LeagueSeasonMember = {
  player: userData3,
};

export const leagueSeasonMemberData4: LeagueSeasonMember = {
  player: userData4,
};

export const leagueSeasonMemberData5: LeagueSeasonMember = {
  player: userData5,
};

export const leagueSeasonMemberData6: LeagueSeasonMember = {
  player: userData6,
};

export const leagueSeasonMemberData7: LeagueSeasonMember = {
  player: userData7,
};

export const leagueSeasonMemberData8: LeagueSeasonMember = {
  player: userData8,
};

export const leagueSeasonMemberData9: LeagueSeasonMember = {
  player: userData9,
};

export const leagueSeasonMembersData: Record<UserIdType, LeagueSeasonMember> = {
  [userData1.userId]: leagueSeasonMemberData1,
  [userData2.userId]: leagueSeasonMemberData2,
  [userData3.userId]: leagueSeasonMemberData3,
  [userData4.userId]: leagueSeasonMemberData4,
  [userData5.userId]: leagueSeasonMemberData5,
  [userData6.userId]: leagueSeasonMemberData6,
  [userData7.userId]: leagueSeasonMemberData7,
  [userData8.userId]: leagueSeasonMemberData8,
  [userData9.userId]: leagueSeasonMemberData9,
};
