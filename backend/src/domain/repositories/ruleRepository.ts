import type { Rule } from "@/domain/models.js";

export interface RuleRepository {
  list(): Promise<Rule[]>;
  get(ruleId: string): Promise<Rule>;
  create(input: {
    name: string;
    description: string;
    gameType: Rule["gameType"];
    uma: Rule["uma"];
    oka: Rule["oka"];
    scoreCalculation: Rule["scoreCalculation"];
  }): Promise<Rule>;
  update(
    ruleId: string,
    input: Partial<{
      name: string;
      description: string;
      gameType: Rule["gameType"];
      uma: Rule["uma"];
      oka: Rule["oka"];
      scoreCalculation: Rule["scoreCalculation"];
    }>,
  ): Promise<Rule>;
  delete(ruleId: string): Promise<void>;
}
