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
  const json: CreateSessionInput = {
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    memberUserIds: input.memberUserIds,
    tableLabel: input.tableLabel,
  };

  return executeApiRequest<CreateSessionResponse>(() =>
    createSessionRequest({
      param: { leagueId: input.leagueId, seasonId: input.seasonId },
      json,
    })
  );
};

export const fetchSessionDetail = async (input: {
  leagueId: string;
  seasonId: string;
  sessionId: string;
}) => {
  return executeApiRequest<FetchSessionDetailResponse>(() =>
    fetchSessionDetailRequest({ param: input })
  );
};

export const updateSession = async (input: {
  leagueId: string;
  seasonId: string;
  sessionId: string;
  endedAt?: string | null;
  tableLabel?: string | null;
}) => {
  const json: UpdateSessionInput = {
    endedAt: input.endedAt,
    tableLabel: input.tableLabel,
  };

  return executeApiRequest<UpdateSessionResponse>(() =>
    updateSessionRequest({
      param: {
        leagueId: input.leagueId,
        seasonId: input.seasonId,
        sessionId: input.sessionId,
      },
      json,
    })
  );
};

export const deleteSession = async (input: {
  leagueId: string;
  seasonId: string;
  sessionId: string;
}) => {
  await executeNoContentRequest(() =>
    apiClient.api.leagues[":leagueId"].seasons[":seasonId"].sessions[
      ":sessionId"
    ].$delete({ param: input })
  );
};
