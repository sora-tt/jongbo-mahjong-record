import type { NumberOfEachOrder } from "./league";

export type PersonalRecordSeasonOption = {
  id: string;
  leagueId: string;
  seasonId: string;
  name: string;
};

export type PersonalRecordStats = {
  totalPoints: number;
  totalMatchCount: number;
  rank: number | null;
  averageRank: number;
  top2Rate: number;
  numberOfEachOrder: NumberOfEachOrder;
};
