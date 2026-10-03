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
) =>
  z
    .union([
      z.strictObject({
        ...scopeFilterShape,
        ...endpointFields,
        scopeType: z.literal("overall"),
        leagueId: z.never().optional(),
        seasonId: z.never().optional(),
      }),
      z.strictObject({
        ...scopeFilterShape,
        ...endpointFields,
        scopeType: z.literal("league"),
        leagueId: opaqueIdQuerySchema,
        seasonId: z.never().optional(),
      }),
      z.strictObject({
        ...scopeFilterShape,
        ...endpointFields,
        scopeType: z.literal("season"),
        leagueId: opaqueIdQuerySchema,
        seasonId: opaqueIdQuerySchema,
      }),
    ])
    .refine(
      (query) => {
        const range = query as { from?: IsoDateString; to?: IsoDateString };
        return isDateRangeOrdered({ from: range.from, to: range.to });
      },
      {
        message: "from must be less than or equal to to",
        path: ["to"],
      },
    );

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
  windowSize: urlIntegerSchema.pipe(
    z.union([z.literal(10), z.literal(20), z.literal(50)]),
  ),
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
