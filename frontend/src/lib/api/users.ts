import { type InferResponseType } from "hono/client";

import {
  apiClient,
  ApiError,
  getApiBaseUrl,
  parseDataResponse,
} from "@/lib/api/core";

const fetchMeRequest = apiClient.api.users.me.$get;
const fetchJoiningSeasonsRequest =
  apiClient.api.users[":userId"]["joining-seasons"].$get;

type CreateMeResponse = InferResponseType<
  typeof apiClient.api.users.me.$post,
  201
>["data"];

type FetchMeResponse = InferResponseType<typeof fetchMeRequest>["data"];
type FetchJoiningSeasonsResponse = InferResponseType<
  typeof fetchJoiningSeasonsRequest
>["data"];
type FetchUserStatsResponse = {
  id: string;
  userId: string;
  userName: string;
  scopeType: "overall" | "league" | "season";
  leagueId: string | null;
  seasonId: string | null;
  leagueName: string | null;
  seasonName: string | null;
  totalPoints: number;
  totalMatchCount: number;
  averageRank: number;
  currentRank: number | null;
  firstCount: number;
  secondCount: number;
  thirdCount: number;
  fourthCount: number | null;
  firstRate: number;
  secondRate: number;
  thirdRate: number;
  fourthRate: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  averageScore: number | null;
  winStreak: number | null;
  loseStreak: number | null;
  createdAt: string;
  updatedAt: string;
};

type ApiErrorPayload = {
  error?: {
    message?: string;
    code?: string;
    details?: unknown;
  };
};

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
  const url = new URL(`${getApiBaseUrl()}/api/users/${input.userId}/stats`);
  url.searchParams.set("scopeType", input.scopeType);

  if (input.leagueId) {
    url.searchParams.set("leagueId", input.leagueId);
  }

  if (input.seasonId) {
    url.searchParams.set("seasonId", input.seasonId);
  }

  const response = await fetch(url.toString(), {
    credentials: "include",
  });

  const payload = (await response.json().catch(() => null)) as
    | { data: FetchUserStatsResponse }
    | ApiErrorPayload
    | null;

  if (!response.ok) {
    throw new ApiError(
      payload &&
        "error" in payload &&
        typeof payload.error?.message === "string"
        ? payload.error.message
        : "API request failed",
      response.status,
      payload && "error" in payload ? payload.error?.code : undefined,
      payload && "error" in payload ? payload.error?.details : undefined
    );
  }

  return (payload as { data: FetchUserStatsResponse }).data;
};
