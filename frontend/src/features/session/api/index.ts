import { type InferResponseType } from "hono/client";

import {
  apiClient,
  executeApiRequest,
  executeNoContentRequest,
} from "@/lib/api/core";

import type {
  CreateSessionInput,
  UpdateSessionInput,
} from "@/lib/api/contracts";

const listSessionsRequest =
  apiClient.api.leagues[":leagueId"].seasons[":seasonId"].sessions.$get;
const createSessionRequest =
  apiClient.api.leagues[":leagueId"].seasons[":seasonId"].sessions.$post;
const getSessionRequest =
  apiClient.api.leagues[":leagueId"].seasons[":seasonId"].sessions[":sessionId"]
    .$get;
const updateSessionRequest =
  apiClient.api.leagues[":leagueId"].seasons[":seasonId"].sessions[":sessionId"]
    .$patch;
const deleteSessionRequest =
  apiClient.api.leagues[":leagueId"].seasons[":seasonId"].sessions[":sessionId"]
    .$delete;

type SessionListResponse = InferResponseType<
  typeof listSessionsRequest
>["data"];
type SessionResponse = InferResponseType<typeof getSessionRequest>["data"];
type CreateSessionResponse = InferResponseType<
  typeof createSessionRequest,
  201
>["data"];
type UpdateSessionResponse = InferResponseType<
  typeof updateSessionRequest
>["data"];

export type { CreateSessionInput, UpdateSessionInput };

export const listSessions = async (leagueId: string, seasonId: string) =>
  executeApiRequest<SessionListResponse>(() =>
    listSessionsRequest({ param: { leagueId, seasonId } })
  );

export const createSession = async (
  leagueId: string,
  seasonId: string,
  input: CreateSessionInput
) =>
  executeApiRequest<CreateSessionResponse>(() =>
    createSessionRequest({
      param: { leagueId, seasonId },
      json: input,
    })
  );

export const getSession = async (input: {
  leagueId: string;
  seasonId: string;
  sessionId: string;
}) =>
  executeApiRequest<SessionResponse>(() => getSessionRequest({ param: input }));

export const updateSession = async (input: {
  leagueId: string;
  seasonId: string;
  sessionId: string;
  endedAt?: string | null;
  tableLabel?: string | null;
}) => {
  const { leagueId, seasonId, sessionId, endedAt, tableLabel } = input;
  return executeApiRequest<UpdateSessionResponse>(() =>
    updateSessionRequest({
      param: { leagueId, seasonId, sessionId },
      json: { endedAt, tableLabel },
    })
  );
};

export const deleteSession = async (input: {
  leagueId: string;
  seasonId: string;
  sessionId: string;
}) => executeNoContentRequest(() => deleteSessionRequest({ param: input }));
