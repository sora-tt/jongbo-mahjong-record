import type { InferRequestType, InferResponseType } from "hono/client";
import { hc } from "hono/client";
import type { InferInput } from "hono/validator";
import type { StatisticsAnalysis } from "@/domain/statistics/types.js";
import { statisticsScopeQuerySchema } from "@/presentation/schemas/statistics.js";
import type { AppType } from "@/presentation/app.js";

type Client = ReturnType<typeof hc<AppType>>;

type Expect<T extends true> = T;
type Equal<Left, Right> =
  (<T>() => T extends Left ? 1 : 2) extends <T>() => T extends Right ? 1 : 2
    ? true
    : false;

type SummaryGet = Client["api"]["users"][":userId"]["statistics"]["$get"];
type AnalysisGet =
  Client["api"]["users"][":userId"]["statistics"]["analysis"]["$get"];
type HistoryGet =
  Client["api"]["users"][":userId"]["statistics"]["matches"]["$get"];

type SummaryRequest = InferRequestType<SummaryGet>;
type RawScopeQuery = import("zod").input<typeof statisticsScopeQuerySchema>;
type HonoScopeInput = InferInput<RawScopeQuery, "query">;
type AnalysisRequest = InferRequestType<AnalysisGet>;
type HistoryRequest = InferRequestType<HistoryGet>;
type SummaryResponse = InferResponseType<SummaryGet, 200>;
type AnalysisResponse = InferResponseType<AnalysisGet, 200>;
type HistoryResponse = InferResponseType<HistoryGet, 200>;

type _SummaryPathParam = Expect<
  Equal<SummaryRequest["param"], { userId: string }>
>;
type _SummaryScopes = Expect<
  Equal<SummaryRequest["query"]["scopeType"], "overall" | "league" | "season">
>;
type _ValidatedSummaryScopes = Expect<
  Equal<RawScopeQuery["scopeType"], "overall" | "league" | "season">
>;
type _HonoSchemaScopeInput = Expect<
  Equal<HonoScopeInput["scopeType"], "overall" | "league" | "season">
>;
type _SummaryCommonFilters = Expect<
  Equal<
    Pick<SummaryRequest["query"], "from" | "to" | "gameType">,
    {
      from?: string;
      to?: string;
      gameType?: "all" | "sanma" | "yonma";
    }
  >
>;
type _SummaryEnvelope = Expect<Equal<keyof SummaryResponse, "data">>;
type _SummaryStatuses = Expect<
  Equal<SummaryResponse["data"]["status"], "ready" | "empty" | "uncomputed">
>;

type _AnalysisPathParam = Expect<
  Equal<AnalysisRequest["param"], { userId: string }>
>;
type _AnalysisDimension = Expect<
  Equal<
    AnalysisRequest["query"]["dimension"],
    StatisticsAnalysis["breakdown"]["dimension"]
  >
>;
type _AnalysisWindow = Expect<
  Equal<AnalysisRequest["query"]["windowSize"], "10" | "20" | "50">
>;
type _AnalysisScopes = Expect<
  Equal<AnalysisRequest["query"]["scopeType"], "overall" | "league" | "season">
>;
type _AnalysisStatuses = Expect<
  Equal<AnalysisResponse["data"]["status"], "ready" | "empty" | "uncomputed">
>;
type _AnalysisBreakdownCursor = Expect<
  Equal<
    Extract<
      AnalysisResponse["data"],
      { breakdown: unknown }
    >["breakdown"]["nextCursor"],
    string | null
  >
>;

type _HistoryPathParam = Expect<
  Equal<HistoryRequest["param"], { userId: string }>
>;
type _HistoryScopes = Expect<
  Equal<HistoryRequest["query"]["scopeType"], "overall" | "league" | "season">
>;
type _HistoryCursor = Expect<
  Equal<HistoryRequest["query"]["cursor"], string | undefined>
>;
type _HistoryLimit = Expect<
  Equal<HistoryRequest["query"]["limit"], string | undefined>
>;
type _HistoryStatuses = Expect<
  Equal<HistoryResponse["data"]["status"], "ready" | "empty" | "uncomputed">
>;
type _HistoryNextCursor = Expect<
  Equal<HistoryResponse["data"]["nextCursor"], string | null>
>;

export type StatisticsAppTypeContract = [
  _SummaryPathParam,
  _SummaryScopes,
  _ValidatedSummaryScopes,
  _HonoSchemaScopeInput,
  _SummaryCommonFilters,
  _SummaryEnvelope,
  _SummaryStatuses,
  _AnalysisPathParam,
  _AnalysisDimension,
  _AnalysisWindow,
  _AnalysisScopes,
  _AnalysisStatuses,
  _AnalysisBreakdownCursor,
  _HistoryPathParam,
  _HistoryScopes,
  _HistoryCursor,
  _HistoryLimit,
  _HistoryStatuses,
  _HistoryNextCursor,
];
