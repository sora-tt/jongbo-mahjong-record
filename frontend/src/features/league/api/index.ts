import { type InferResponseType } from "hono/client";

import { apiClient, executeApiRequest } from "@/lib/api/core";

import type { CreateLeagueInput, UpdateLeagueInput } from "@/lib/api/contracts";

const fetchLeaguesRequest = apiClient.api.leagues.$get;
const fetchLeagueDetailRequest = apiClient.api.leagues[":leagueId"].$get;
const fetchLeagueMembersRequest =
  apiClient.api.leagues[":leagueId"].members.$get;
const createLeagueRequest = apiClient.api.leagues.$post;
const updateLeagueRequest = apiClient.api.leagues[":leagueId"].$patch;

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
  executeApiRequest<FetchLeaguesResponse>(() => fetchLeaguesRequest());

export const fetchLeagueDetail = async (leagueId: string) =>
  executeApiRequest<FetchLeagueDetailResponse>(() =>
    fetchLeagueDetailRequest({ param: { leagueId } })
  );

export const fetchLeagueMembers = async (leagueId: string) =>
  executeApiRequest<FetchLeagueMembersResponse>(() =>
    fetchLeagueMembersRequest({ param: { leagueId } })
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
