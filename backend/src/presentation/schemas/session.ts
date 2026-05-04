import { z } from "zod";
import type {
  CreateSessionInput,
  UpdateSessionInput,
} from "@/domain/session/repository.js";

export const createSessionSchema: z.ZodType<
  Omit<CreateSessionInput, "createdBy">
> = z.object({
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().nullable().optional(),
  memberUserIds: z.array(z.string().min(1)).min(3).max(4),
  tableLabel: z.string().min(1).nullable().optional(),
});

export const updateSessionSchema: z.ZodType<UpdateSessionInput> = z.object({
  endedAt: z.string().datetime().nullable().optional(),
  tableLabel: z.string().min(1).nullable().optional(),
});
