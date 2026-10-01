import { z } from "zod";
import type {
  CreateMatchInput,
  UpdateMatchInput,
} from "@/domain/match/repository.js";

const resultSchema = z.object({
  userId: z.string().min(1),
  wind: z.enum(["east", "south", "west", "north"]),
  rawScore: z.number().int(),
});

const chomboEventSchema = z.object({ offenderUserId: z.string().min(1) });

export const createMatchSchema: z.ZodType<CreateMatchInput> = z.object({
  playedAt: z.string().datetime(),
  results: z.array(resultSchema).min(3).max(4),
  chomboEvents: z.array(chomboEventSchema).optional(),
  offTableKyotakuCount: z.number().int().nonnegative().optional(),
});

export const updateMatchSchema: z.ZodType<UpdateMatchInput> = z.object({
  playedAt: z.string().datetime().optional(),
  results: z.array(resultSchema).min(3).max(4).optional(),
  chomboEvents: z.array(chomboEventSchema).optional(),
  offTableKyotakuCount: z.number().int().nonnegative().optional(),
});
