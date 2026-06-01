import { type InferResponseType } from "hono/client";

import { apiClient, parseDataResponse } from "@/lib/api/core";

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

export type CreateSeasonInput = {
  name: string;
  memberUserIds: string[];
  status?: "active" | "archived";
};

export const fetchLeagueSeasons = async (leagueId: string) => {
  const response = await fetchLeagueSeasonsRequest({
    param: { leagueId },
  });

  return parseDataResponse<FetchLeagueSeasonsResponse>(response);
};

export const createSeason = async (
  leagueId: string,
  input: CreateSeasonInput
) => {
  const response = await createSeasonRequest({
    param: { leagueId },
    json: input,
  });

  return parseDataResponse<CreateSeasonResponse>(response);
};

export const fetchSeasonDetail = async (leagueId: string, seasonId: string) => {
  const response = await fetchSeasonDetailRequest({
    param: { leagueId, seasonId },
  });

  return parseDataResponse<FetchSeasonDetailResponse>(response);
};
