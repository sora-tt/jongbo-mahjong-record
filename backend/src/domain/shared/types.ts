export type GameType = "sanma" | "yonma";
export type SeasonStatus = "active" | "archived";
export type ScopeType = "overall" | "league" | "season";
export type ScoreCalculation =
  | "decimal"
  | "fiveDropSixUp"
  | "round"
  | "floor"
  | "ceil";
export type Wind = "east" | "south" | "west" | "north";

export type RecordHolder = {
  value: number;
  userId: string;
  userName: string;
};
