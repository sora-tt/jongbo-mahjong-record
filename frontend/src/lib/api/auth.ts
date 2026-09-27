import { type InferResponseType } from "hono/client";

import {
  apiClient,
  executeApiRequest,
  executeNoContentRequest,
} from "@/lib/api/core";

type CreateSessionResponse = InferResponseType<
  typeof apiClient.api.auth.session.$post,
  201
>["data"];

export const createSession = async (idToken: string) =>
  executeApiRequest<CreateSessionResponse>(() =>
    apiClient.api.auth.session.$post({
      header: {
        "x-id-token": idToken,
      },
    })
  );

export const deleteSession = async () => {
  await executeNoContentRequest(() => apiClient.api.auth.session.$delete());
};
