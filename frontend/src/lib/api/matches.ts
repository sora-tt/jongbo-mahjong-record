import { type InferResponseType } from "hono/client";

import {
  apiClient,
  executeApiRequest,
  executeNoContentRequest,
} from "@/lib/api/core";

import type { MatchResultInput } from "@/lib/api/contracts";

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

export type { MatchResultInput };

export const fetchMatches = async (input: {
  leagueId: string;
  seasonId: string;
  sessionId: string;
}) => {
  return executeApiRequest<FetchMatchesResponse>(() =>
    fetchMatchesRequest({ param: input })
  );
};

export const createMatch = async (input: {
  leagueId: string;
  seasonId: string;
  sessionId: string;
  playedAt: string;
  results: MatchResultInput;
}) => {
  return executeApiRequest<CreateMatchResponse>(() =>
    createMatchRequest({
      param: {
        leagueId: input.leagueId,
        seasonId: input.seasonId,
        sessionId: input.sessionId,
      },
      json: { playedAt: input.playedAt, results: input.results },
    })
  );
};

export const updateMatch = async (input: {
  leagueId: string;
  seasonId: string;
  sessionId: string;
  matchId: string;
  playedAt?: string;
  results?: MatchResultInput;
}) => {
  return executeApiRequest<UpdateMatchResponse>(() =>
    updateMatchRequest({
      param: {
        leagueId: input.leagueId,
        seasonId: input.seasonId,
        sessionId: input.sessionId,
        matchId: input.matchId,
      },
      json: { playedAt: input.playedAt, results: input.results },
    })
  );
};

export const deleteMatch = async (input: {
  leagueId: string;
  seasonId: string;
  sessionId: string;
  matchId: string;
}) => {
  await executeNoContentRequest(() => deleteMatchRequest({ param: input }));
};
