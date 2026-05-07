import { type InferResponseType } from "hono/client";

import { apiClient, parseDataResponse } from "@/lib/api/core";

const fetchLeaguesRequest = apiClient.api.leagues.$get;
const fetchLeagueDetailRequest = apiClient.api.leagues[":leagueId"].$get;

type FetchLeaguesResponse = InferResponseType<
  typeof fetchLeaguesRequest
>["data"];

type FetchLeagueDetailResponse = InferResponseType<
  typeof fetchLeagueDetailRequest
>["data"];

export const fetchLeagues = async () => {
  const response = await fetchLeaguesRequest();
  return parseDataResponse<FetchLeaguesResponse>(response);
};

export const fetchLeagueDetail = async (leagueId: string) => {
  const response = await fetchLeagueDetailRequest({
    param: { leagueId },
  });

  return parseDataResponse<FetchLeagueDetailResponse>(response);
};
