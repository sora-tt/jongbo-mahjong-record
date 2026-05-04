import { type InferResponseType } from "hono/client";

import { apiClient, ensureOk, parseDataResponse } from "@/lib/api/core";

const createSessionRequest =
  apiClient.api.leagues[":leagueId"].seasons[":seasonId"].sessions.$post;

type CreateSessionResponse = InferResponseType<
  typeof createSessionRequest,
  201
>["data"];

export const createSession = async (input: {
  leagueId: string;
  seasonId: string;
  startedAt: string;
  endedAt?: string | null;
  memberUserIds: string[];
  tableLabel?: string | null;
}) => {
  const response = await createSessionRequest({
    param: {
      leagueId: input.leagueId,
      seasonId: input.seasonId,
    },
    json: {
      startedAt: input.startedAt,
      endedAt: input.endedAt,
      memberUserIds: input.memberUserIds,
      tableLabel: input.tableLabel,
    },
  });

  return parseDataResponse<CreateSessionResponse>(response);
};

export const deleteSession = async (input: {
  leagueId: string;
  seasonId: string;
  sessionId: string;
}) => {
  const response = await apiClient.api.leagues[":leagueId"].seasons[
    ":seasonId"
  ].sessions[":sessionId"].$delete({
    param: input,
  });

  await ensureOk(response);
  return null;
};
