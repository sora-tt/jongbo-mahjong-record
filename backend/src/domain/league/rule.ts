import type { LeagueRule } from "@/domain/league/types.js";
import { ValidationError } from "@/domain/shared/errors.js";

export const validateLeagueRule = (rule: LeagueRule): void => {
  if (rule.uma.mode === "floatingCount") {
    const gameType: string = rule.gameType;
    if (gameType !== "yonma") {
      throw new ValidationError(
        "floatingCount uma is only supported for yonma",
        {
          field: "rule.uma.mode",
          mode: rule.uma.mode,
          gameType,
        },
      );
    }

    for (const floatingCount of [0, 1, 2, 3, 4] as const) {
      const points = rule.uma.pointsByFloatingCount?.[floatingCount];
      if (points == null) {
        throw new ValidationError(
          `floatingCount ${floatingCount} is required`,
          {
            field: "rule.uma.pointsByFloatingCount",
            mode: rule.uma.mode,
            floatingCount,
          },
        );
      }

      const values = [points.first, points.second, points.third, points.fourth];
      if (!values.every(Number.isInteger)) {
        throw new ValidationError(
          `floatingCount ${floatingCount} rank points must be integers`,
          {
            field: "rule.uma.pointsByFloatingCount",
            mode: rule.uma.mode,
            floatingCount,
          },
        );
      }

      const actualTotal = values.reduce((total, value) => total + value, 0);
      if (actualTotal !== 0) {
        throw new ValidationError(
          `floatingCount ${floatingCount} rule.uma must total zero`,
          {
            field: "rule.uma",
            mode: rule.uma.mode,
            floatingCount,
            expectedTotal: 0,
            actualTotal,
          },
        );
      }
    }

    return;
  }

  const values = [rule.uma.first, rule.uma.second, rule.uma.third];
  if (rule.gameType === "yonma") {
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
