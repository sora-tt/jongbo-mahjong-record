import type { LeagueMember, LeagueSeasonMember } from "@/types/domain/league";

/**
 * LeagueMember を LeagueSeasonMember に変換する
 * 不足フィールド（averageRank, top2Rate）は初期値で埋める
 */
export const convertLeagueMemberToLeagueSeasonMember = (
  member: LeagueMember
): LeagueSeasonMember => {
  return {
    player: member.player,
    totalPoints: member.totalPoints,
    gamesPlayed: member.gamesPlayed,
    rank: member.rank,
    numberOfEachOrder: member.numberOfEachOrder,
    averageRank: 0, // 初期値
    top2Rate: 0, // 初期値
  };
};
