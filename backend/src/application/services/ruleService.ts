import type { RuleRepository } from "@/domain/repositories/ruleRepository.js";
import { ValidationError } from "@/errors.js";

export class RuleService {
  constructor(private readonly ruleRepository: RuleRepository) {}

  listRules() {
    return this.ruleRepository.list();
  }

  getRule(ruleId: string) {
    return this.ruleRepository.get(ruleId);
  }

  createRule(input: {
    name: string;
    description?: string;
    gameType: "sanma" | "yonma";
    uma: {
      first: number;
      second: number;
      third: number;
      fourth: number | null;
    };
    oka: { startingPoints: number; returnPoints: number };
    scoreCalculation: "decimal" | "fiveDropSixUp" | "round" | "floor" | "ceil";
  }) {
    if (!input.name.trim()) {
      throw new ValidationError("name is required");
    }

    return this.ruleRepository.create({
      ...input,
      description: input.description ?? "",
    });
  }

  updateRule(
    ruleId: string,
    input: Partial<{
      name: string;
      description: string;
      gameType: "sanma" | "yonma";
      uma: {
        first: number;
        second: number;
        third: number;
        fourth: number | null;
      };
      oka: { startingPoints: number; returnPoints: number };
      scoreCalculation:
        | "decimal"
        | "fiveDropSixUp"
        | "round"
        | "floor"
        | "ceil";
    }>,
  ) {
    return this.ruleRepository.update(ruleId, input);
  }

  deleteRule(ruleId: string) {
    return this.ruleRepository.delete(ruleId);
  }
}
