import type { GameType, ScoreCalculation } from "@/domain/shared/types.js";

export type Rule = {
  id: string;
  name: string;
  description: string;
  gameType: GameType;
  uma: {
    first: number;
    second: number;
    third: number;
    fourth: number | null;
  };
  oka: {
    startingPoints: number;
    returnPoints: number;
  };
  scoreCalculation: ScoreCalculation;
  createdAt: string;
  updatedAt: string;
};
