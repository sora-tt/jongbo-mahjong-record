import { z } from "zod";
import { asOpaqueId } from "@/domain/shared/types.js";
import type { IsoDateString } from "@/domain/shared/types.js";
import type {
  StatisticsAnalysisQuery,
  StatisticsMatchHistoryQuery,
  StatisticsScope,
} from "@/domain/statistics/types.js";

const isoDateTimeQuerySchema = z
  .string()
  .datetime({ offset: true })
  .transform((value) => value as IsoDateString);

const opaqueIdQuerySchema = z.string().min(1).transform(asOpaqueId);
const gameTypeQuerySchema = z.enum(["all", "sanma", "yonma"]);
const cursorQuerySchema = z.string().min(1);

const scopeFilterShape = {
  from: isoDateTimeQuerySchema.optional(),
  to: isoDateTimeQuerySchema.optional(),
  gameType: gameTypeQuerySchema.optional(),
};

const isDateRangeOrdered = (query: { from?: string; to?: string }) =>
  query.from === undefined ||
  query.to === undefined ||
  Date.parse(query.from) <= Date.parse(query.to);

const createStatisticsScopeQuerySchema = <TEndpoint extends z.ZodRawShape>(
  endpointFields: TEndpoint,
) => {
  type ScopeQueryOutput = {
    from?: IsoDateString;
    to?: IsoDateString;
    gameType?: "all" | "sanma" | "yonma";
    scopeType: "overall" | "league" | "season";
    leagueId?: ReturnType<typeof asOpaqueId>;
    seasonId?: ReturnType<typeof asOpaqueId>;
  } & { [Key in keyof TEndpoint]: z.output<TEndpoint[Key]> };

  const schema = z.strictObject({
    ...scopeFilterShape,
    ...endpointFields,
    scopeType: z.enum(["overall", "league", "season"]),
    leagueId: opaqueIdQuerySchema.optional(),
    seasonId: opaqueIdQuerySchema.optional(),
  });

  return schema
    .superRefine((value, context) => {
      const query = value as ScopeQueryOutput;
      if (!isDateRangeOrdered({ from: query.from, to: query.to })) {
        context.addIssue({
          code: "custom",
          message: "from must be less than or equal to to",
          path: ["to"],
        });
      }

      if (query.scopeType === "overall") {
        if (query.leagueId !== undefined) {
          context.addIssue({
            code: "custom",
            message: "leagueId is not allowed for overall scope",
            path: ["leagueId"],
          });
        }
        if (query.seasonId !== undefined) {
          context.addIssue({
            code: "custom",
            message: "seasonId is not allowed for overall scope",
            path: ["seasonId"],
          });
        }
      } else if (query.scopeType === "league") {
        if (query.leagueId === undefined) {
          context.addIssue({
            code: "custom",
            message: "leagueId is required when scopeType is league",
            path: ["leagueId"],
          });
        }
        if (query.seasonId !== undefined) {
          context.addIssue({
            code: "custom",
            message: "seasonId is not allowed for league scope",
            path: ["seasonId"],
          });
        }
      } else {
        if (query.leagueId === undefined) {
          context.addIssue({
            code: "custom",
            message: "leagueId is required when scopeType is season",
            path: ["leagueId"],
          });
        }
        if (query.seasonId === undefined) {
          context.addIssue({
            code: "custom",
            message: "seasonId is required when scopeType is season",
            path: ["seasonId"],
          });
        }
      }
    })
    .transform((value) => {
      const query = value as ScopeQueryOutput;
      const { scopeType, leagueId, seasonId, ...filtersAndEndpoint } = query;

      if (scopeType === "overall") {
        return { ...filtersAndEndpoint, scopeType };
      }
      if (scopeType === "league") {
        return {
          ...filtersAndEndpoint,
          scopeType,
          leagueId: asRequiredId(leagueId),
        };
      }
      return {
        ...filtersAndEndpoint,
        scopeType,
        leagueId: asRequiredId(leagueId),
        seasonId: asRequiredId(seasonId),
      };
    });
};

const asRequiredId = (value: string | undefined) => {
  if (value === undefined) {
    throw new TypeError("validated statistics scope is missing an ID");
  }
  return asOpaqueId(value);
};

export const statisticsScopeQuerySchema = createStatisticsScopeQuerySchema(
  {},
) satisfies z.ZodType<StatisticsScope>;

const urlIntegerSchema = z
  .string()
  .regex(/^\d+$/, "must be a positive integer")
  .transform(Number);

const pageLimitSchema = urlIntegerSchema.pipe(z.number().int().min(1).max(100));

const breakdownDimensionSchema = z.enum([
  "period",
  "weekday",
  "timeOfDay",
  "seat",
  "opponent",
  "session",
]);

const statisticsAnalysisBaseSchema = createStatisticsScopeQuerySchema({
  dimension: breakdownDimensionSchema,
  groupBy: z.enum(["day", "month", "year"]).optional(),
  windowSize: z
    .enum(["10", "20", "50"])
    .transform(Number)
    .pipe(z.union([z.literal(10), z.literal(20), z.literal(50)])),
  limit: pageLimitSchema.optional(),
  cursor: cursorQuerySchema.optional(),
});

export const statisticsAnalysisQuerySchema = statisticsAnalysisBaseSchema
  .refine(
    (query) => query.dimension === "period" || query.groupBy === undefined,
    {
      message: "groupBy is only supported for the period dimension",
      path: ["groupBy"],
    },
  )
  .refine(
    (query) =>
      query.dimension === "opponent" || query.dimension === "session"
        ? true
        : query.limit === undefined && query.cursor === undefined,
    {
      message: "limit and cursor are only supported for opponent/session",
      path: ["limit"],
    },
  )
  .transform((query) =>
    query.dimension === "opponent" || query.dimension === "session"
      ? { ...query, limit: query.limit ?? 20 }
      : query,
  ) satisfies z.ZodType<
  Omit<StatisticsAnalysisQuery, "viewerUserId" | "targetUserId">
>;

export const statisticsMatchHistoryQuerySchema =
  createStatisticsScopeQuerySchema({
    limit: pageLimitSchema.optional().default(50),
    cursor: cursorQuerySchema.optional(),
  }) satisfies z.ZodType<
    Omit<StatisticsMatchHistoryQuery, "viewerUserId" | "targetUserId">
  >;
