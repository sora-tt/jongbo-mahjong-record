import { type InferResponseType } from "hono/client";

import { apiClient, executeApiRequest } from "@/lib/api/core";

import type { CreateLeagueInput, UpdateLeagueInput } from "@/lib/api/contracts";

const fetchLeaguesRequest = apiClient.api.leagues.$get;
const fetchLeagueDetailRequest = apiClient.api.leagues[":leagueId"].$get;
const createLeagueRequest = apiClient.api.leagues.$post;
const updateLeagueRequest = apiClient.api.leagues[":leagueId"].$patch;

type FetchLeaguesResponse = InferResponseType<
  typeof fetchLeaguesRequest
>["data"];

type CreateLeagueResponse = InferResponseType<
  typeof createLeagueRequest,
  201
>["data"];

type UpdateLeagueResponse = InferResponseType<
  typeof updateLeagueRequest
>["data"];

type FetchLeagueDetailResponse = InferResponseType<
  typeof fetchLeagueDetailRequest
>["data"];

export type { CreateLeagueInput, UpdateLeagueInput };

export const fetchLeagues = async () => {
  return executeApiRequest<FetchLeaguesResponse>(() => fetchLeaguesRequest());
};

export const createLeague = async (input: CreateLeagueInput) => {
  return executeApiRequest<CreateLeagueResponse>(() =>
    createLeagueRequest({ json: input })
  );
};

export const updateLeague = async (
  leagueId: string,
  input: UpdateLeagueInput
) => {
  return executeApiRequest<UpdateLeagueResponse>(() =>
    updateLeagueRequest({
      param: { leagueId },
      json: input,
    })
  );
};

export const fetchLeagueDetail = async (leagueId: string) => {
  return executeApiRequest<FetchLeagueDetailResponse>(() =>
    fetchLeagueDetailRequest({ param: { leagueId } })
  );
};
