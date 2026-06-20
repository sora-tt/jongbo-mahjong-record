import { LeagueSeasonMember } from "@/types/domain/league";
import { UserIdType } from "@/types/domain/user";

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

export const leagueSeasonMemberData1: LeagueSeasonMember = {
  player: userData1,
  totalPoints: 100,
  gamesPlayed: 10,
  rank: 1,
  numberOfEachOrder: { first: 3, second: 3, third: 2, fourth: 2 },
  averageRank: 2.3,
  top2Rate: 60,
};

export const leagueSeasonMemberData2: LeagueSeasonMember = {
  player: userData2,
  totalPoints: 50,
  gamesPlayed: 10,
  rank: 2,
  numberOfEachOrder: { first: 2, second: 3, third: 3, fourth: 2 },
  averageRank: 2.3,
  top2Rate: 60,
};

export const leagueSeasonMemberData3: LeagueSeasonMember = {
  player: userData3,
  totalPoints: -20,
  gamesPlayed: 10,
  rank: 3,
  numberOfEachOrder: { first: 2, second: 2, third: 3, fourth: 3 },
  averageRank: 2.3,
  top2Rate: 60,
};

export const leagueSeasonMemberData4: LeagueSeasonMember = {
  player: userData4,
  totalPoints: 30,
  gamesPlayed: 10,
  rank: 4,
  numberOfEachOrder: { first: 3, second: 2, third: 2, fourth: 3 },
  averageRank: 2.3,
  top2Rate: 60,
};

export const leagueSeasonMemberData5: LeagueSeasonMember = {
  player: userData5,
  totalPoints: 10,
  gamesPlayed: 10,
  rank: 5,
  numberOfEachOrder: { first: 2, second: 3, third: 2, fourth: 3 },
  averageRank: 2.3,
  top2Rate: 60,
};

export const leagueSeasonMemberData6: LeagueSeasonMember = {
  player: userData6,
  totalPoints: -50,
  gamesPlayed: 10,
  rank: 6,
  numberOfEachOrder: { first: 1, second: 2, third: 4, fourth: 3 },
  averageRank: 2.3,
  top2Rate: 60,
};

export const leagueSeasonMemberData7: LeagueSeasonMember = {
  player: userData7,
  totalPoints: 20,
  gamesPlayed: 10,
  rank: 7,
  numberOfEachOrder: { first: 3, second: 1, third: 3, fourth: 3 },
  averageRank: 2.3,
  top2Rate: 60,
};

export const leagueSeasonMemberData8: LeagueSeasonMember = {
  player: userData8,
  totalPoints: -30,
  gamesPlayed: 10,
  rank: 8,
  numberOfEachOrder: { first: 2, second: 1, third: 4, fourth: 3 },
  averageRank: 2.3,
  top2Rate: 60,
};

export const leagueSeasonMemberData9: LeagueSeasonMember = {
  player: userData9,
  totalPoints: 0,
  gamesPlayed: 10,
  rank: 9,
  numberOfEachOrder: { first: 2, second: 2, third: 2, fourth: 4 },
  averageRank: 2.3,
  top2Rate: 60,
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

//個人成績画面動作確認のために、userData1のmockデータ追記
//雀望リーグ -2026シーズン秋冬
export const leagueSeasonMemberData10: LeagueSeasonMember = {
  player: userData1,
  totalPoints: -125.4,
  gamesPlayed: 18,
  rank: 7,
  numberOfEachOrder: { first: 3, second: 2, third: 7, fourth: 6 },
  averageRank: 2.89,
  top2Rate: 27.78,
};

//土田リーグ -レギュラーシーズン
export const leagueSeasonMemberData11: LeagueSeasonMember = {
  player: userData1,
  totalPoints: 1104.4,
  gamesPlayed: 142,
  rank: 1,
  numberOfEachOrder: { first: 45, second: 38, third: 34, fourth: 25 },
  averageRank: 2.27,
  top2Rate: 58.45,
};

//土田リーグ -ファイナルシーズン
export const leagueSeasonMemberData12: LeagueSeasonMember = {
  player: userData1,
  totalPoints: 42.1,
  gamesPlayed: 6,
  rank: 2,
  numberOfEachOrder: { first: 2, second: 1, third: 2, fourth: 1 },
  averageRank: 2.33,
  top2Rate: 50,
};

export const leagueSeasonMembersData2: Record<UserIdType, LeagueSeasonMember> =
  {
    [userData1.userId]: leagueSeasonMemberData10,
  };

export const leagueSeasonMembersData3: Record<UserIdType, LeagueSeasonMember> =
  {
    [userData1.userId]: leagueSeasonMemberData11,
  };

export const leagueSeasonMembersData4: Record<UserIdType, LeagueSeasonMember> =
  {
    [userData1.userId]: leagueSeasonMemberData12,
  };
