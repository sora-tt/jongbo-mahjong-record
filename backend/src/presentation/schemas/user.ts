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

export const getUserStatsQuerySchema = z
  .object({
    scopeType: z.enum(["overall", "league", "season"]),
    leagueId: z.string().optional(),
    seasonId: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.scopeType === "league" && !value.leagueId) {
      ctx.addIssue({
        code: "custom",
        path: ["leagueId"],
        message: "leagueId is required when scopeType is league",
      });
    }

    if (value.scopeType === "season") {
      if (!value.leagueId) {
        ctx.addIssue({
          code: "custom",
          path: ["leagueId"],
          message: "leagueId is required when scopeType is season",
        });
      }

      if (!value.seasonId) {
        ctx.addIssue({
          code: "custom",
          path: ["seasonId"],
          message: "seasonId is required when scopeType is season",
        });
      }
    }
  });
