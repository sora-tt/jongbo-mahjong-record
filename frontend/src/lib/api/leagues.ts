import { type InferResponseType } from "hono/client";

import { apiClient, parseDataResponse } from "@/lib/api/core";

type FetchLeaguesResponse = InferResponseType<
  typeof apiClient.api.leagues.$get
>["data"];

export const fetchLeagues = async () => {
  const response = await apiClient.api.leagues.$get();
  return parseDataResponse<FetchLeaguesResponse>(response);
};
