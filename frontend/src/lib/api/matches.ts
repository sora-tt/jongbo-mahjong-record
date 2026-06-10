import { type InferResponseType } from "hono/client";

import { apiClient, ensureOk, parseDataResponse } from "@/lib/api/core";

const fetchMatchesRequest =
  apiClient.api.leagues[":leagueId"].seasons[":seasonId"].sessions[":sessionId"]
    .matches.$get;
const createMatchRequest =
  apiClient.api.leagues[":leagueId"].seasons[":seasonId"].sessions[":sessionId"]
    .matches.$post;
const updateMatchRequest =
  apiClient.api.leagues[":leagueId"].seasons[":seasonId"].sessions[":sessionId"]
    .matches[":matchId"].$patch;
const deleteMatchRequest =
  apiClient.api.leagues[":leagueId"].seasons[":seasonId"].sessions[":sessionId"]
    .matches[":matchId"].$delete;

type FetchMatchesResponse = InferResponseType<
  typeof fetchMatchesRequest
>["data"];
type CreateMatchResponse = InferResponseType<
  typeof createMatchRequest,
  201
>["data"];
type UpdateMatchResponse = InferResponseType<typeof updateMatchRequest>["data"];

type MatchResultInput = Array<{
  userId: string;
  wind: "east" | "south" | "west" | "north";
  rank: number;
  rawScore: number;
}>;

export const fetchMatches = async (input: {
  leagueId: string;
  seasonId: string;
  sessionId: string;
}) => {
  const response = await fetchMatchesRequest({
    param: input,
  });

  return parseDataResponse<FetchMatchesResponse>(response);
};

export const createMatch = async (input: {
  leagueId: string;
  seasonId: string;
  sessionId: string;
  playedAt: string;
  results: MatchResultInput;
}) => {
  const response = await createMatchRequest({
    param: {
      leagueId: input.leagueId,
      seasonId: input.seasonId,
      sessionId: input.sessionId,
    },
    json: {
      playedAt: input.playedAt,
      results: input.results,
    },
  });

  return parseDataResponse<CreateMatchResponse>(response);
};

export const updateMatch = async (input: {
  leagueId: string;
  seasonId: string;
  sessionId: string;
  matchId: string;
  playedAt?: string;
  results?: MatchResultInput;
}) => {
  const response = await updateMatchRequest({
    param: {
      leagueId: input.leagueId,
      seasonId: input.seasonId,
      sessionId: input.sessionId,
      matchId: input.matchId,
    },
    json: {
      playedAt: input.playedAt,
      results: input.results,
    },
  });

  return parseDataResponse<UpdateMatchResponse>(response);
};

export const deleteMatch = async (input: {
  leagueId: string;
  seasonId: string;
  sessionId: string;
  matchId: string;
}) => {
  const response = await deleteMatchRequest({
    param: input,
  });

  await ensureOk(response);
};
