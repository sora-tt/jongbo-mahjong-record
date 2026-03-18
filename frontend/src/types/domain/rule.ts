export type Rule = {
  ruleId: RuleIdType;
  name: string;
  description?: string;

  /**
   * 三麻 or 四麻
   */
  mode: "sanma" | "yonma";

  /**
   * オカ設定（持ち点 / 返し点）
   */
  oka: OkaType;

  /**
   * ウマ（順位ごとのポイント）
   */
  uma: UmaTable;

  /**
   * 点数計算の方式
   * 小数点有効 | 五捨六入 | 四捨五入 | 切り捨て | 切り上げ
   */
  scoreCalc: "decimal" | "fiveDropSixUp" | "round" | "floor" | "ceil";
};

export type RuleIdType = string;

export type OkaType = {
  startPoints: number;
  returnPoints: number;
};

export type Rank = 1 | 2 | 3 | 4;

export type UmaTable = Partial<Record<Rank, number>>;
