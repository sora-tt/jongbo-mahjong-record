import { type InferResponseType } from "hono/client";

import { apiClient, parseDataResponse } from "@/lib/api/core";

const fetchLeagueSeasonsRequest =
  apiClient.api.leagues[":leagueId"].seasons.$get;
const fetchSeasonDetailRequest =
  apiClient.api.leagues[":leagueId"].seasons[":seasonId"].$get;

type FetchLeagueSeasonsResponse = InferResponseType<
  typeof fetchLeagueSeasonsRequest
>["data"];

type FetchSeasonDetailResponse = InferResponseType<
  typeof fetchSeasonDetailRequest
>["data"];

export const fetchLeagueSeasons = async (leagueId: string) => {
  const response = await fetchLeagueSeasonsRequest({
    param: { leagueId },
  });

  return parseDataResponse<FetchLeagueSeasonsResponse>(response);
};

export const fetchSeasonDetail = async (leagueId: string, seasonId: string) => {
  const response = await fetchSeasonDetailRequest({
    param: { leagueId, seasonId },
  });

  return parseDataResponse<FetchSeasonDetailResponse>(response);
};
