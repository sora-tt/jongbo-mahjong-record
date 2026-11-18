import { type InferResponseType } from "hono/client";

import { apiClient, executeApiRequest } from "@/lib/api/core";
import { cachedRequest } from "@/lib/api/request-cache";

import type { CreateMeInput, UpdateMeInput } from "@/lib/api/contracts";

const searchUsersRequest = apiClient.api.users.$get;

type CreateMeResponse = InferResponseType<
  typeof apiClient.api.users.me.$post,
  201
>["data"];
type FetchMeResponse = InferResponseType<
  typeof apiClient.api.users.me.$get
>["data"];
type UpdateMeResponse = InferResponseType<
  typeof apiClient.api.users.me.$patch
>["data"];
type SearchUsersResponse = InferResponseType<typeof searchUsersRequest>["data"];

export const createMe = async (input: CreateMeInput) =>
  executeApiRequest<CreateMeResponse>(() =>
    apiClient.api.users.me.$post({ json: input })
  );

export const fetchMe = async () =>
  cachedRequest("users/me", () =>
    executeApiRequest<FetchMeResponse>(() => apiClient.api.users.me.$get())
  );

export const updateMe = async (input: UpdateMeInput) =>
  executeApiRequest<UpdateMeResponse>(() =>
    apiClient.api.users.me.$patch({ json: input })
  );

export const searchUsers = async (query: string) =>
  executeApiRequest<SearchUsersResponse>(() =>
    searchUsersRequest({ query: { query } })
  );
