import { type InferResponseType } from "hono/client";

import { apiClient, parseDataResponse } from "@/lib/api/core";

const fetchMeRequest = apiClient.api.users.me.$get;
const fetchJoiningSeasonsRequest =
  apiClient.api.users[":userId"]["joining-seasons"].$get;
const fetchUserStatsRequest = apiClient.api.users[":userId"].stats.$get;

type CreateMeResponse = InferResponseType<
  typeof apiClient.api.users.me.$post,
  201
>["data"];

type FetchMeResponse = InferResponseType<typeof fetchMeRequest>["data"];
type FetchJoiningSeasonsResponse = InferResponseType<
  typeof fetchJoiningSeasonsRequest
>["data"];
type FetchUserStatsResponse = InferResponseType<
  typeof fetchUserStatsRequest
>["data"];

export const createMe = async (input: { name: string; username: string }) => {
  const response = await apiClient.api.users.me.$post({
    json: input,
  });

  return parseDataResponse<CreateMeResponse>(response);
};

export const fetchMe = async () => {
  const response = await fetchMeRequest();
  return parseDataResponse<FetchMeResponse>(response);
};

export const fetchJoiningSeasons = async (userId: string) => {
  const response = await fetchJoiningSeasonsRequest({
    param: { userId },
  });

  return parseDataResponse<FetchJoiningSeasonsResponse>(response);
};

export const fetchUserStats = async (input: {
  userId: string;
  scopeType: "overall" | "league" | "season";
  leagueId?: string;
  seasonId?: string;
}) => {
  const response = await fetchUserStatsRequest({
    param: { userId: input.userId },
    query: {
      scopeType: input.scopeType,
      leagueId: input.leagueId,
      seasonId: input.seasonId,
    },
  });

  return parseDataResponse<FetchUserStatsResponse>(response);
};
