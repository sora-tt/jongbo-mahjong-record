import { type InferResponseType } from "hono/client";

import {
  apiClient,
  executeApiRequest,
  executeNoContentRequest,
} from "@/lib/api/core";
import { cachedRequest } from "@/lib/api/request-cache";

import type { CreateLeagueInput, UpdateLeagueInput } from "@/lib/api/contracts";

const fetchLeaguesRequest = apiClient.api.leagues.$get;
const fetchLeagueDetailRequest = apiClient.api.leagues[":leagueId"].$get;
const fetchLeagueMembersRequest =
  apiClient.api.leagues[":leagueId"].members.$get;
const createLeagueRequest = apiClient.api.leagues.$post;
const updateLeagueRequest = apiClient.api.leagues[":leagueId"].$patch;
const deleteLeagueRequest = apiClient.api.leagues[":leagueId"].$delete;

type FetchLeaguesResponse = InferResponseType<
  typeof fetchLeaguesRequest
>["data"];
type FetchLeagueDetailResponse = InferResponseType<
  typeof fetchLeagueDetailRequest
>["data"];
type FetchLeagueMembersResponse = InferResponseType<
  typeof fetchLeagueMembersRequest
>["data"];
type CreateLeagueResponse = InferResponseType<
  typeof createLeagueRequest,
  201
>["data"];
type UpdateLeagueResponse = InferResponseType<
  typeof updateLeagueRequest
>["data"];

export type { CreateLeagueInput, UpdateLeagueInput };

export const fetchLeagues = async () =>
  cachedRequest("leagues", () =>
    executeApiRequest<FetchLeaguesResponse>(() => fetchLeaguesRequest())
  );

export const fetchLeagueDetail = async (
  leagueId: string,
  options?: { fresh?: boolean }
) => {
  const load = () =>
    executeApiRequest<FetchLeagueDetailResponse>(() =>
      fetchLeagueDetailRequest(
        { param: { leagueId } },
        options?.fresh ? { init: { cache: "no-store" } } : undefined
      )
    );
  return options?.fresh ? load() : cachedRequest(`league/${leagueId}`, load);
};

export const fetchLeagueMembers = async (leagueId: string) =>
  cachedRequest(`league/${leagueId}/members`, () =>
    executeApiRequest<FetchLeagueMembersResponse>(() =>
      fetchLeagueMembersRequest({ param: { leagueId } })
    )
  );

export const createLeague = async (input: CreateLeagueInput) =>
  executeApiRequest<CreateLeagueResponse>(() =>
    createLeagueRequest({ json: input })
  );

export const updateLeague = async (
  leagueId: string,
  input: UpdateLeagueInput
) =>
  executeApiRequest<UpdateLeagueResponse>(() =>
    updateLeagueRequest({ param: { leagueId }, json: input })
  );

export const deleteLeague = async (leagueId: string) =>
  executeNoContentRequest(() => deleteLeagueRequest({ param: { leagueId } }));
