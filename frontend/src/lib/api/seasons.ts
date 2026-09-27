import { type InferResponseType } from "hono/client";

import { apiClient, executeApiRequest } from "@/lib/api/core";

import type { CreateSeasonInput } from "@/lib/api/contracts";

const fetchLeagueSeasonsRequest =
  apiClient.api.leagues[":leagueId"].seasons.$get;
const createSeasonRequest = apiClient.api.leagues[":leagueId"].seasons.$post;
const fetchSeasonDetailRequest =
  apiClient.api.leagues[":leagueId"].seasons[":seasonId"].$get;

type FetchLeagueSeasonsResponse = InferResponseType<
  typeof fetchLeagueSeasonsRequest
>["data"];
type CreateSeasonResponse = InferResponseType<
  typeof createSeasonRequest,
  201
>["data"];

type FetchSeasonDetailResponse = InferResponseType<
  typeof fetchSeasonDetailRequest
>["data"];

export type { CreateSeasonInput };

export const fetchLeagueSeasons = async (leagueId: string) => {
  return executeApiRequest<FetchLeagueSeasonsResponse>(() =>
    fetchLeagueSeasonsRequest({ param: { leagueId } })
  );
};

export const createSeason = async (
  leagueId: string,
  input: CreateSeasonInput
) => {
  return executeApiRequest<CreateSeasonResponse>(() =>
    createSeasonRequest({ param: { leagueId }, json: input })
  );
};

export const fetchSeasonDetail = async (leagueId: string, seasonId: string) => {
  return executeApiRequest<FetchSeasonDetailResponse>(() =>
    fetchSeasonDetailRequest({ param: { leagueId, seasonId } })
  );
};
