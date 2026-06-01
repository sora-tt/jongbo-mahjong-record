import { type InferResponseType } from "hono/client";

import { apiClient, parseDataResponse } from "@/lib/api/core";

const fetchLeaguesRequest = apiClient.api.leagues.$get;
const fetchLeagueDetailRequest = apiClient.api.leagues[":leagueId"].$get;
const createLeagueRequest = apiClient.api.leagues.$post;

type FetchLeaguesResponse = InferResponseType<
  typeof fetchLeaguesRequest
>["data"];

type CreateLeagueResponse = InferResponseType<
  typeof createLeagueRequest,
  201
>["data"];

type FetchLeagueDetailResponse = InferResponseType<
  typeof fetchLeagueDetailRequest
>["data"];

export type CreateLeagueInput = {
  name: string;
  memberUserIds: string[];
  rule: {
    gameType: "sanma" | "yonma";
    oka: {
      startingPoints: number;
      returnPoints: number;
    };
    uma: {
      first: number;
      second: number;
      third: number;
      fourth: number | null;
    };
  };
};

export const fetchLeagues = async () => {
  const response = await fetchLeaguesRequest();
  return parseDataResponse<FetchLeaguesResponse>(response);
};

export const createLeague = async (input: CreateLeagueInput) => {
  const response = await createLeagueRequest({
    json: input,
  });

  return parseDataResponse<CreateLeagueResponse>(response);
};

export const fetchLeagueDetail = async (leagueId: string) => {
  const response = await fetchLeagueDetailRequest({
    param: { leagueId },
  });

  return parseDataResponse<FetchLeagueDetailResponse>(response);
};
