import { type InferResponseType } from "hono/client";

import { apiClient, ensureOk, parseDataResponse } from "@/lib/api/core";

type CreateSessionResponse = InferResponseType<
  typeof apiClient.api.auth.session.$post,
  201
>["data"];

export const createSession = async (idToken: string) => {
  const response = await apiClient.api.auth.session.$post({
    json: { idToken },
  });

  return parseDataResponse<CreateSessionResponse>(response);
};

export const deleteSession = async () => {
  const response = await apiClient.api.auth.session.$delete();
  await ensureOk(response);
  return null;
};
