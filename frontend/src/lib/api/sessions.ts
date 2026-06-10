import { type InferResponseType } from "hono/client";

import { apiClient, ensureOk, parseDataResponse } from "@/lib/api/core";

const createSessionRequest =
  apiClient.api.leagues[":leagueId"].seasons[":seasonId"].sessions.$post;
const fetchSessionDetailRequest =
  apiClient.api.leagues[":leagueId"].seasons[":seasonId"].sessions[":sessionId"]
    .$get;
const updateSessionRequest =
  apiClient.api.leagues[":leagueId"].seasons[":seasonId"].sessions[":sessionId"]
    .$patch;

type CreateSessionResponse = InferResponseType<
  typeof createSessionRequest,
  201
>["data"];
type FetchSessionDetailResponse = InferResponseType<
  typeof fetchSessionDetailRequest
>["data"];
type UpdateSessionResponse = InferResponseType<
  typeof updateSessionRequest
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

export const fetchSessionDetail = async (input: {
  leagueId: string;
  seasonId: string;
  sessionId: string;
}) => {
  const response = await fetchSessionDetailRequest({
    param: input,
  });

  return parseDataResponse<FetchSessionDetailResponse>(response);
};

export const updateSession = async (input: {
  leagueId: string;
  seasonId: string;
  sessionId: string;
  endedAt?: string | null;
  tableLabel?: string | null;
}) => {
  const response = await updateSessionRequest({
    param: {
      leagueId: input.leagueId,
      seasonId: input.seasonId,
      sessionId: input.sessionId,
    },
    json: {
      endedAt: input.endedAt,
      tableLabel: input.tableLabel,
    },
  });

  return parseDataResponse<UpdateSessionResponse>(response);
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
