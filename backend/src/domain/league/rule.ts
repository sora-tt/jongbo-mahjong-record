import type { LeagueRule } from "@/domain/league/types.js";
import { ValidationError } from "@/domain/shared/errors.js";

export const validateLeagueRule = (rule: LeagueRule): void => {
  const values = [rule.uma.first, rule.uma.second, rule.uma.third];
  if (rule.gameType === "yonma") {
    if (rule.uma.fourth === null) {
      throw new ValidationError("rule.uma.fourth is required for yonma", {
        field: "rule.uma.fourth",
        gameType: rule.gameType,
      });
    }
    values.push(rule.uma.fourth);
  } else if (rule.uma.fourth !== null) {
    throw new ValidationError("rule.uma.fourth must be null for sanma", {
      field: "rule.uma.fourth",
      gameType: rule.gameType,
    });
  }

  const actualTotal = values.reduce((total, value) => total + value, 0);
  if (actualTotal !== 0) {
    throw new ValidationError("rule.uma must total zero", {
      field: "rule.uma",
      gameType: rule.gameType,
      expectedTotal: 0,
      actualTotal,
    });
  }
};
