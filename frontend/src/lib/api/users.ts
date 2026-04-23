import { type InferResponseType } from "hono/client";

import { apiClient, parseDataResponse } from "@/lib/api/core";

type CreateMeResponse = InferResponseType<
  typeof apiClient.api.users.me.$post,
  201
>["data"];

type FetchMeResponse = InferResponseType<
  typeof apiClient.api.users.me.$get
>["data"];

export const createMe = async (input: { name: string; username: string }) => {
  const response = await apiClient.api.users.me.$post({
    json: input,
  });

  return parseDataResponse<CreateMeResponse>(response);
};

export const fetchMe = async () => {
  const response = await apiClient.api.users.me.$get();
  return parseDataResponse<FetchMeResponse>(response);
};
