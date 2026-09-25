import { type InferResponseType } from "hono/client";

import { apiClient, executeApiRequest } from "@/lib/api/core";

import type { CreateMeInput } from "@/lib/api/contracts";

const searchUsersRequest = apiClient.api.users.$get;

type CreateMeResponse = InferResponseType<
  typeof apiClient.api.users.me.$post,
  201
>["data"];
type FetchMeResponse = InferResponseType<
  typeof apiClient.api.users.me.$get
>["data"];
type SearchUsersResponse = InferResponseType<typeof searchUsersRequest>["data"];

export const createMe = async (input: CreateMeInput) =>
  executeApiRequest<CreateMeResponse>(() =>
    apiClient.api.users.me.$post({ json: input })
  );

export const fetchMe = async () =>
  executeApiRequest<FetchMeResponse>(() => apiClient.api.users.me.$get());

export const searchUsers = async (query: string) =>
  executeApiRequest<SearchUsersResponse>(() =>
    searchUsersRequest({ query: { query } })
  );
