import { AppError } from "@/domain/shared/errors.js";

export class StatisticsTargetAccessError extends AppError {
  constructor(details?: Record<string, unknown>) {
    super("forbidden", 403, "forbidden", details);
  }
}
