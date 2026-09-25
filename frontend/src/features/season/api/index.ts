import { type InferResponseType } from "hono/client";

import { apiClient, executeApiRequest } from "@/lib/api/core";

import type { CreateSeasonInput, UpdateSeasonInput } from "@/lib/api/contracts";

const fetchLeagueSeasonsRequest =
  apiClient.api.leagues[":leagueId"].seasons.$get;
const createSeasonRequest = apiClient.api.leagues[":leagueId"].seasons.$post;
const fetchSeasonDetailRequest =
  apiClient.api.leagues[":leagueId"].seasons[":seasonId"].$get;
const updateSeasonRequest =
  apiClient.api.leagues[":leagueId"].seasons[":seasonId"].$patch;

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
type UpdateSeasonResponse = InferResponseType<
  typeof updateSeasonRequest
>["data"];

export type { CreateSeasonInput, UpdateSeasonInput };

export const fetchLeagueSeasons = async (leagueId: string) =>
  executeApiRequest<FetchLeagueSeasonsResponse>(() =>
    fetchLeagueSeasonsRequest({ param: { leagueId } })
  );

export const fetchSeasonDetail = async (leagueId: string, seasonId: string) =>
  executeApiRequest<FetchSeasonDetailResponse>(() =>
    fetchSeasonDetailRequest({ param: { leagueId, seasonId } })
  );

export const createSeason = async (
  leagueId: string,
  input: CreateSeasonInput
) =>
  executeApiRequest<CreateSeasonResponse>(() =>
    createSeasonRequest({ param: { leagueId }, json: input })
  );

export const updateSeason = async (
  leagueId: string,
  seasonId: string,
  input: UpdateSeasonInput
) =>
  executeApiRequest<UpdateSeasonResponse>(() =>
    updateSeasonRequest({
      param: { leagueId, seasonId },
      json: input,
    })
  );
