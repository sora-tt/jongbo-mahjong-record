import { type InferResponseType } from "hono/client";

import { apiClient, executeApiRequest } from "@/lib/api/core";

import type { CreateMeInput } from "@/lib/api/contracts";

const fetchJoiningSeasonsRequest =
  apiClient.api.users[":userId"]["joining-seasons"].$get;
const searchUsersRequest = apiClient.api.users.$get;
const fetchUserStatsRequest = apiClient.api.users[":userId"].stats.$get;

type CreateMeResponse = InferResponseType<
  typeof apiClient.api.users.me.$post,
  201
>["data"];
type FetchMeResponse = InferResponseType<
  typeof apiClient.api.users.me.$get
>["data"];
type FetchJoiningSeasonsResponse = InferResponseType<
  typeof fetchJoiningSeasonsRequest
>["data"];
type SearchUsersResponse = InferResponseType<typeof searchUsersRequest>["data"];
type FetchUserStatsResponse = InferResponseType<
  typeof fetchUserStatsRequest
>["data"];

export const createMe = async (input: CreateMeInput) =>
  executeApiRequest<CreateMeResponse>(() =>
    apiClient.api.users.me.$post({ json: input })
  );

export const fetchMe = async () =>
  executeApiRequest<FetchMeResponse>(() => apiClient.api.users.me.$get());

export const searchUsers = async (query: string) =>
  executeApiRequest<SearchUsersResponse>(() =>
    searchUsersRequest({ query: { query } })
  );

export const fetchJoiningSeasons = async (userId: string) =>
  executeApiRequest<FetchJoiningSeasonsResponse>(() =>
    fetchJoiningSeasonsRequest({ param: { userId } })
  );

export const fetchUserStats = async (input: {
  userId: string;
  scopeType: "overall" | "league" | "season";
  leagueId?: string;
  seasonId?: string;
}) =>
  executeApiRequest<FetchUserStatsResponse>(() =>
    fetchUserStatsRequest({
      param: { userId: input.userId },
      query: {
        scopeType: input.scopeType,
        ...(input.leagueId ? { leagueId: input.leagueId } : {}),
        ...(input.seasonId ? { seasonId: input.seasonId } : {}),
      },
    })
  );
