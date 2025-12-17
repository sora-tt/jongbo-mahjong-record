import { userData1, userData2, userData3, userData4 } from "./user";

import { LeagueMember } from "@/types/domain/league";

export const leagueMemberData1: LeagueMember = {
  player: userData1,
  joinedAt: new Date(2025, 9, 1),
  role: "owner",
  createdAt: new Date(2025, 9, 1),

  totalPoints: 100,
  gamesPlayed: 20,
  rank: 1,
};

export const leagueMemberData2: LeagueMember = {
  player: userData2,
  joinedAt: new Date(2025, 9, 1),
  role: "member",
  createdAt: new Date(2025, 9, 1),

  totalPoints: 10,
  gamesPlayed: 20,
  rank: 2,
};

export const leagueMemberData3: LeagueMember = {
  player: userData3,
  joinedAt: new Date(2025, 9, 1),
  role: "member",
  createdAt: new Date(2025, 9, 1),

  totalPoints: -10,
  gamesPlayed: 20,
  rank: 3,
};

export const leagueMemberData4: LeagueMember = {
  player: userData4,
  joinedAt: new Date(2025, 9, 1),
  role: "member",
  createdAt: new Date(2025, 9, 1),

  totalPoints: -100,
  gamesPlayed: 20,
  rank: 4,
};

export const leagueMembersData: LeagueMember[] = [
  leagueMemberData1,
  leagueMemberData2,
  leagueMemberData3,
  leagueMemberData4,
];
