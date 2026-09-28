import { type InferResponseType } from "hono/client";

import { apiClient, executeApiRequest } from "@/lib/api/core";

const currentUserRequest = apiClient.api.users.me.$get;
const joiningSeasonsRequest =
  apiClient.api.users[":userId"]["joining-seasons"].$get;
const userStatsRequest = apiClient.api.users[":userId"].stats.$get;

type CurrentUserResponse = InferResponseType<typeof currentUserRequest>["data"];
type JoiningSeasonsResponse = InferResponseType<
  typeof joiningSeasonsRequest
>["data"];
type UserStatsResponse = InferResponseType<typeof userStatsRequest>["data"];

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
