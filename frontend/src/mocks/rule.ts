import { Rule, RuleIdType } from "@/types/domain/rule";

export const ruleData1: Rule = {
  ruleId: "0001",
  name: "Mリーグルール",
  mode: "yonma",

  oka: {
    startPoints: 25000,
    returnPoints: 30000,
  },

  uma: {
    1: 20,
    2: 10,
    3: -10,
    4: -20,
  },

  scoreCalc: "decimal",
};

export const ruleData2: Rule = {
  ruleId: "0002",
  name: "ラス回避ルール",
  mode: "yonma",

  oka: {
    startPoints: 25000,
    returnPoints: 30000,
  },

  uma: {
    1: 25,
    2: 10,
    3: -5,
    4: -30,
  },

  scoreCalc: "decimal",
};

export const rulesData: Record<RuleIdType, Rule> = {
  [ruleData1.ruleId]: ruleData1,
  [ruleData2.ruleId]: ruleData2,
};
