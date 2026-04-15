import { z } from "zod";

const umaSchema = z.object({
  first: z.number(),
  second: z.number(),
  third: z.number(),
  fourth: z.number().nullable(),
});

const okaSchema = z.object({
  startingPoints: z.number(),
  returnPoints: z.number(),
});

const gameTypeSchema = z.enum(["sanma", "yonma"]);
const scoreCalculationSchema = z.enum([
  "decimal",
  "fiveDropSixUp",
  "round",
  "floor",
  "ceil",
]);

export const createRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  gameType: gameTypeSchema,
  uma: umaSchema,
  oka: okaSchema,
  scoreCalculation: scoreCalculationSchema,
});

export const updateRuleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  gameType: gameTypeSchema.optional(),
  uma: umaSchema.optional(),
  oka: okaSchema.optional(),
  scoreCalculation: scoreCalculationSchema.optional(),
});

export type CreateRuleInput = z.infer<typeof createRuleSchema>;
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;
