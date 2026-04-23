import { z } from "zod";
import type {
  CreateSeasonInput,
  UpdateSeasonInput,
} from "@/domain/season/repository.js";

export const createSeasonSchema: z.ZodType<CreateSeasonInput> = z.object({
  name: z.string().min(1),
  memberUserIds: z.array(z.string().min(1)).min(1),
  status: z.enum(["active", "archived"]).optional(),
});

export const updateSeasonSchema: z.ZodType<UpdateSeasonInput> = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(["active", "archived"]).optional(),
});
