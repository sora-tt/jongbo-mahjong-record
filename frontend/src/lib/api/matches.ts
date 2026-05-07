import { type InferResponseType } from "hono/client";

import { apiClient, parseDataResponse } from "@/lib/api/core";

const createMatchRequest =
  apiClient.api.leagues[":leagueId"].seasons[":seasonId"].sessions[":sessionId"]
    .matches.$post;

type CreateMatchResponse = InferResponseType<
  typeof createMatchRequest,
  201
>["data"];

export const createMatch = async (input: {
  leagueId: string;
  seasonId: string;
  sessionId: string;
  playedAt: string;
  results: Array<{
    userId: string;
    wind: "east" | "south" | "west" | "north";
    rank: number;
    rawScore: number;
  }>;
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
