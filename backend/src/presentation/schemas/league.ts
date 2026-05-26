import { z } from "zod";
import type {
  CreateLeagueInput,
  UpdateLeagueInput,
} from "@/domain/league/repository.js";

const gameTypeSchema = z.enum(["sanma", "yonma"]);

const leagueRuleSchema = z
  .object({
    gameType: gameTypeSchema,
    oka: z.object({
      startingPoints: z.number().int(),
      returnPoints: z.number().int(),
    }),
    uma: z.object({
      first: z.number().int(),
      second: z.number().int(),
      third: z.number().int(),
      fourth: z.number().int().nullable(),
    }),
  })
  .superRefine((value, ctx) => {
    if (value.gameType === "sanma" && value.uma.fourth !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["uma", "fourth"],
        message: "fourth must be null when gameType is sanma",
      });
    }

    if (value.gameType === "yonma" && value.uma.fourth === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["uma", "fourth"],
        message: "fourth is required when gameType is yonma",
      });
    }
  });

export const createLeagueSchema: z.ZodType<CreateLeagueInput> = z.object({
  name: z.string().min(1),
  rule: leagueRuleSchema,
  memberUserIds: z.array(z.string().min(1)),
});

export const updateLeagueSchema: z.ZodType<UpdateLeagueInput> = z.object({
  name: z.string().min(1).optional(),
  rule: leagueRuleSchema.optional(),
  memberUserIds: z.array(z.string().min(1)).optional(),
});
