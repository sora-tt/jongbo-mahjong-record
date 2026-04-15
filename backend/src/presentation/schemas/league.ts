import { z } from "zod";
import type {
  CreateLeagueInput,
  UpdateLeagueInput,
} from "@/domain/league/repository.js";

export const createLeagueSchema: z.ZodType<CreateLeagueInput> = z.object({
  name: z.string().min(1),
  ruleId: z.string().min(1),
  memberUserIds: z.array(z.string().min(1)).min(1),
});

export const updateLeagueSchema: z.ZodType<UpdateLeagueInput> = z.object({
  name: z.string().min(1).optional(),
});
