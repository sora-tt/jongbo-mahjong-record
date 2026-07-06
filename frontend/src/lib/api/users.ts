import { type InferResponseType } from "hono/client";

import {
  apiClient,
  ApiError,
  getApiBaseUrl,
  parseDataResponse,
} from "@/lib/api/core";
import { getCurrentIdToken } from "@/lib/firebase/auth";

const fetchJoiningSeasonsRequest =
  apiClient.api.users[":userId"]["joining-seasons"].$get;
const searchUsersRequest = apiClient.api.users.$get;

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
type SearchUser = {
  id: string;
  username: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

type SearchUsersResponse = SearchUser[];
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

const USERS_API_TIMEOUT_MS = 8000;

const fetchWithTimeout = async (input: string, init: RequestInit) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), USERS_API_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "AbortError" || error.message.includes("aborted"))
    ) {
      throw new ApiError(
        `users api request timed out after ${USERS_API_TIMEOUT_MS}ms`,
        504,
        "upstream_timeout"
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const parseFetchDataResponse = async <T>(response: Response): Promise<T> => {
  const payload = (await response.json().catch(() => null)) as
    | { data: T }
    | ApiErrorPayload
    | null;

  if (!response.ok) {
    throw new ApiError(
      payload && "error" in payload && payload.error?.message
        ? payload.error.message
        : "API request failed",
      response.status,
      payload && "error" in payload ? payload.error?.code : undefined,
      payload && "error" in payload ? payload.error?.details : undefined
    );
  }

  return (payload as { data: T }).data;
};

export const createMe = async (
  input: { name: string; username: string },
  idToken?: string
) => {
  const response = await fetchWithTimeout(`${getApiBaseUrl()}/api/users/me`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { "x-id-token": idToken } : {}),
    },
    body: JSON.stringify(input),
  });

  return parseFetchDataResponse<CreateMeResponse>(response);
};

export const fetchMe = async (idToken?: string) => {
  const authToken = idToken ?? (await getCurrentIdToken());
  const response = await fetchWithTimeout(`${getApiBaseUrl()}/api/users/me`, {
    method: "GET",
    credentials: "include",
    headers: authToken ? { "x-id-token": authToken } : undefined,
  });
  return parseFetchDataResponse<FetchMeResponse>(response);
};

export const searchUsers = async (query: string) => {
  const response = await searchUsersRequest({
    query: { query },
  });

  return parseDataResponse<SearchUsersResponse>(response);
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
