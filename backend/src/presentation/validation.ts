import { zValidator } from "@hono/zod-validator";
import { ValidationError } from "@/domain/shared/errors.js";
import { z } from "zod";

const toValidationDetails = (issues: z.core.$ZodIssue[]) => ({
  issues: issues.map((issue) => ({
    path: issue.path,
    message: issue.message,
  })),
});

export const validateJson = <T extends z.ZodTypeAny>(schema: T) =>
  zValidator("json", schema, (result) => {
    if (!result.success) {
      throw new ValidationError(
        "request validation failed",
        toValidationDetails(result.error.issues),
      );
    }
  });

export const validateQuery = <T extends z.ZodTypeAny>(schema: T) =>
  zValidator("query", schema, (result) => {
    if (!result.success) {
      throw new ValidationError(
        "query validation failed",
        toValidationDetails(result.error.issues),
      );
    }
  });
