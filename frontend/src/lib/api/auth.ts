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

type SendVerificationEmailResponse = InferResponseType<
  (typeof apiClient.api.auth)["verification-email"]["$post"],
  200
>["data"];

type ConfirmVerificationEmailResponse = InferResponseType<
  (typeof apiClient.api.auth)["verify-email"]["$post"],
  200
>["data"];

export const createSession = async (idToken: string) =>
  executeApiRequest<CreateSessionResponse>(() =>
    apiClient.api.auth.session.$post({
      header: {
        "x-id-token": idToken,
      },
    })
  );

export const sendVerificationEmail = async () =>
  executeApiRequest<SendVerificationEmailResponse>(() =>
    apiClient.api.auth["verification-email"]["$post"]()
  );

export const confirmVerificationEmail = async (oobCode: string) =>
  executeApiRequest<ConfirmVerificationEmailResponse>(() =>
    apiClient.api.auth["verify-email"]["$post"]({
      json: { oobCode },
    })
  );

export const deleteSession = async () => {
  await executeNoContentRequest(() => apiClient.api.auth.session.$delete());
};
