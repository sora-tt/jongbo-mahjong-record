import { type InferRequestType, type InferResponseType } from "hono/client";

import { fetchLeagueMembers } from "@/features/league/api";
import { fetchSeasonMembers } from "@/features/season/api";
import { apiClient, executeApiRequest } from "@/lib/api/core";

const currentUserRequest = apiClient.api.users.me.$get;
const joiningSeasonsRequest =
  apiClient.api.users[":userId"]["joining-seasons"].$get;
const userStatsRequest = apiClient.api.users[":userId"].stats.$get;
const personalStatisticsSummaryRequest =
  apiClient.api.users[":userId"].statistics.$get;
const personalStatisticsAnalysisRequest =
  apiClient.api.users[":userId"].statistics.analysis.$get;
const statisticsMatchHistoryRequest =
  apiClient.api.users[":userId"].statistics.matches.$get;

type CurrentUserResponse = InferResponseType<typeof currentUserRequest>["data"];
type JoiningSeasonsResponse = InferResponseType<
  typeof joiningSeasonsRequest
>["data"];
type UserStatsResponse = InferResponseType<typeof userStatsRequest>["data"];
export type PersonalStatisticsSummaryResponse = InferResponseType<
  typeof personalStatisticsSummaryRequest
>["data"];
export type PersonalStatisticsAnalysisResponse = InferResponseType<
  typeof personalStatisticsAnalysisRequest
>["data"];
export type StatisticsMatchHistoryResponse = InferResponseType<
  typeof statisticsMatchHistoryRequest
>["data"];

export type PersonalStatisticsSummaryQuery = InferRequestType<
  typeof personalStatisticsSummaryRequest
>["query"];
export type PersonalStatisticsAnalysisQuery = InferRequestType<
  typeof personalStatisticsAnalysisRequest
>["query"];
export type StatisticsMatchHistoryQuery = InferRequestType<
  typeof statisticsMatchHistoryRequest
>["query"];

export const getCurrentUser = async () =>
  executeApiRequest<CurrentUserResponse>(() => currentUserRequest());

export const listJoiningSeasons = async (userId: string) =>
  executeApiRequest<JoiningSeasonsResponse>(() =>
    joiningSeasonsRequest({ param: { userId } })
  );

export const getUserStats = async (input: {
  userId: string;
  scopeType: "overall" | "league" | "season";
  leagueId?: string;
  seasonId?: string;
}) =>
  executeApiRequest<UserStatsResponse>(() =>
    userStatsRequest({
      param: { userId: input.userId },
      query: {
        scopeType: input.scopeType,
        ...(input.leagueId ? { leagueId: input.leagueId } : {}),
        ...(input.seasonId ? { seasonId: input.seasonId } : {}),
      },
    })
  );

export const getPersonalStatisticsSummary = async (input: {
  targetUserId: string;
  query: PersonalStatisticsSummaryQuery;
}) =>
  executeApiRequest<PersonalStatisticsSummaryResponse>(() =>
    personalStatisticsSummaryRequest({
      param: { userId: input.targetUserId },
      query: input.query,
    })
  );

export const getPersonalStatisticsAnalysis = async (input: {
  targetUserId: string;
  query: PersonalStatisticsAnalysisQuery;
}) =>
  executeApiRequest<PersonalStatisticsAnalysisResponse>(() =>
    personalStatisticsAnalysisRequest({
      param: { userId: input.targetUserId },
      query: input.query,
    })
  );

export const getStatisticsMatchHistory = async (input: {
  targetUserId: string;
  query: StatisticsMatchHistoryQuery;
}) =>
  executeApiRequest<StatisticsMatchHistoryResponse>(() =>
    statisticsMatchHistoryRequest({
      param: { userId: input.targetUserId },
      query: input.query,
    })
  );

export const listStatisticsLeagueMembers = fetchLeagueMembers;
export const listStatisticsSeasonMembers = fetchSeasonMembers;
