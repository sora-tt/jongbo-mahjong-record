import { type InferResponseType } from "hono/client";

import { apiClient, parseDataResponse } from "@/lib/api/core";

const fetchLeagueSeasonsRequest =
  apiClient.api.leagues[":leagueId"].seasons.$get;

type FetchLeagueSeasonsResponse = InferResponseType<
  typeof fetchLeagueSeasonsRequest
>["data"];

export const fetchLeagueSeasons = async (leagueId: string) => {
  const response = await fetchLeagueSeasonsRequest({
    param: { leagueId },
  });

  return parseDataResponse<FetchLeagueSeasonsResponse>(response);
};
