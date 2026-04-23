import { z } from "zod";

export const createMeSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
});

export const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
});

export const createSessionAuthSchema = z.object({
  idToken: z.string().min(1),
});
