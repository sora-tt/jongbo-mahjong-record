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

import { LeagueMember } from "@/types/domain/league";
import { AppDate } from "@/types/utils/app-date";

export const leagueMemberData1: LeagueMember = {
  player: userData1,
  joinedAt: AppDate.fromYMD({
    year: 2025,
    month: 9,
    day: 1,
  }),
  role: "owner",

  totalPoints: 100,
  gamesPlayed: 20,
  rank: 1,
  numberOfEachOrder: {
    first: 36,
    second: 30,
    third: 28,
    fourth: 20,
  },
};

export const leagueMemberData2: LeagueMember = {
  player: userData2,
  joinedAt: AppDate.fromYMD({
    year: 2025,
    month: 9,
    day: 1,
  }),
  role: "member",

  totalPoints: 10,
  gamesPlayed: 20,
  rank: 2,
  numberOfEachOrder: {
    first: 38,
    second: 25,
    third: 30,
    fourth: 25,
  },
};

export const leagueMemberData3: LeagueMember = {
  player: userData3,
  joinedAt: AppDate.fromYMD({
    year: 2025,
    month: 9,
    day: 1,
  }),
  role: "member",

  totalPoints: -10,
  gamesPlayed: 20,
  rank: 3,
  numberOfEachOrder: {
    first: 33,
    second: 26,
    third: 36,
    fourth: 29,
  },
};

export const leagueMemberData4: LeagueMember = {
  player: userData4,
  joinedAt: AppDate.fromYMD({
    year: 2025,
    month: 9,
    day: 1,
  }),
  role: "member",

  totalPoints: -100,
  gamesPlayed: 20,
  rank: 4,
  numberOfEachOrder: {
    first: 24,
    second: 45,
    third: 30,
    fourth: 23,
  },
};

export const leagueMemberData5: LeagueMember = {
  player: userData5,
  joinedAt: AppDate.fromYMD({
    year: 2025,
    month: 9,
    day: 1,
  }),
  role: "member",

  totalPoints: -100,
  gamesPlayed: 20,
  rank: 5,
  numberOfEachOrder: {
    first: 34,
    second: 28,
    third: 28,
    fourth: 30,
  },
};

export const leagueMemberData6: LeagueMember = {
  player: userData6,
  joinedAt: AppDate.fromYMD({
    year: 2025,
    month: 9,
    day: 1,
  }),
  role: "member",

  totalPoints: -100,
  gamesPlayed: 20,
  rank: 6,
  numberOfEachOrder: {
    first: 24,
    second: 29,
    third: 26,
    fourth: 32,
  },
};

export const leagueMemberData7: LeagueMember = {
  player: userData7,
  joinedAt: AppDate.fromYMD({
    year: 2025,
    month: 9,
    day: 1,
  }),
  role: "member",

  totalPoints: -100,
  gamesPlayed: 20,
  rank: 7,
  numberOfEachOrder: {
    first: 28,
    second: 33,
    third: 34,
    fourth: 42,
  },
};

export const leagueMemberData8: LeagueMember = {
  player: userData8,
  joinedAt: AppDate.fromYMD({
    year: 2025,
    month: 9,
    day: 1,
  }),
  role: "member",

  totalPoints: -100,
  gamesPlayed: 20,
  rank: 8,
  numberOfEachOrder: {
    first: 25,
    second: 23,
    third: 27,
    fourth: 37,
  },
};

export const leagueMemberData9: LeagueMember = {
  player: userData9,
  joinedAt: AppDate.fromYMD({
    year: 2025,
    month: 9,
    day: 1,
  }),
  role: "member",

  totalPoints: -100,
  gamesPlayed: 20,
  rank: 9,
  numberOfEachOrder: {
    first: 0,
    second: 3,
    third: 3,
    fourth: 1,
  },
};

export const leagueMembersData: LeagueMember[] = [
  leagueMemberData1,
  leagueMemberData2,
  leagueMemberData3,
  leagueMemberData4,
  leagueMemberData5,
  leagueMemberData6,
  leagueMemberData7,
  leagueMemberData8,
  leagueMemberData9,
];
