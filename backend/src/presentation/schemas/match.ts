import { z } from "zod";
import type {
  CreateMatchInput,
  UpdateMatchInput,
} from "@/domain/match/repository.js";
import { YAKUMAN_KINDS } from "@/domain/match/yakuman.js";

const resultSchema = z.object({
  userId: z.string().min(1),
  wind: z.enum(["east", "south", "west", "north"]),
  rawScore: z.number().int(),
});

const chomboEventSchema = z.object({ offenderUserId: z.string().min(1) });
const yakumanEventSchema = z.object({
  winnerUserId: z.string().min(1),
  kind: z.enum(YAKUMAN_KINDS),
});

const createMatchBaseSchema = z.object({
  playedAt: z.string().datetime(),
  results: z.array(resultSchema).min(3).max(4),
  chomboEvents: z.array(chomboEventSchema).optional(),
  offTableKyotakuCount: z.number().int().nonnegative().optional(),
});

const updateMatchBaseSchema = z.object({
  playedAt: z.string().datetime().optional(),
  results: z.array(resultSchema).min(3).max(4).optional(),
  chomboEvents: z.array(chomboEventSchema).optional(),
  offTableKyotakuCount: z.number().int().nonnegative().optional(),
});

export const createMatchSchema: z.ZodType<CreateMatchInput> =
  createMatchBaseSchema.extend({
    yakumanEvents: z.array(yakumanEventSchema).optional(),
  });

export const updateMatchSchema: z.ZodType<UpdateMatchInput> =
  updateMatchBaseSchema.extend({
    yakumanEvents: z.array(yakumanEventSchema).optional(),
  });
