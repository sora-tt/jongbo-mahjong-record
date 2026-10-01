import { z } from "zod";
import type {
  CreateLeagueInput,
  UpdateLeagueInput,
} from "@/domain/league/repository.js";

const fixedSanmaUmaSchema = z
  .object({
    mode: z.literal("fixed").optional(),
    first: z.number().int(),
    second: z.number().int(),
    third: z.number().int(),
    fourth: z.null(),
  })
  .transform((uma) => ({ ...uma, mode: "fixed" as const }));

const fixedYonmaUmaSchema = z
  .object({
    mode: z.literal("fixed").optional(),
    first: z.number().int(),
    second: z.number().int(),
    third: z.number().int(),
    fourth: z.number().int(),
  })
  .transform((uma) => ({ ...uma, mode: "fixed" as const }));

const rankPointsSchema = z.object({
  first: z.number().int(),
  second: z.number().int(),
  third: z.number().int(),
  fourth: z.number().int(),
});

const floatingCountUmaSchema = z.object({
  mode: z.literal("floatingCount"),
  pointsByFloatingCount: z.object({
    "0": rankPointsSchema,
    "1": rankPointsSchema,
    "2": rankPointsSchema,
    "3": rankPointsSchema,
    "4": rankPointsSchema,
  }),
});

const leagueRuleSchema = z.discriminatedUnion("gameType", [
  z.object({
    gameType: z.literal("sanma"),
    oka: z.object({
      startingPoints: z.number().int(),
      returnPoints: z.number().int(),
    }),
    uma: fixedSanmaUmaSchema,
  }),
  z.object({
    gameType: z.literal("yonma"),
    oka: z.object({
      startingPoints: z.number().int(),
      returnPoints: z.number().int(),
    }),
    uma: z.union([fixedYonmaUmaSchema, floatingCountUmaSchema]),
  }),
]) satisfies z.ZodType<CreateLeagueInput["rule"]>;

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
