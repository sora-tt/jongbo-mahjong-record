import { hc, type ClientResponse } from "hono/client";

import type { ApiErrorCode } from "@/lib/api/contracts";

export type ApiErrorKind = "api" | "network" | "timeout" | "decode";

type ApiErrorDetails = Record<string, unknown>;

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly code: ApiErrorCode | null;
  readonly details: ApiErrorDetails;
  readonly retryable: boolean;

  constructor(
    message: string,
    status: number | null,
    code: ApiErrorCode | null = null,
    details: ApiErrorDetails = {},
    kind: ApiErrorKind = "api",
    retryable = false
  ) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryable = retryable;
  }
}

type AppType = import("mahjong-record-app-backend").AppType;

export type ApiDataPayload<T> = {
  data: T;
};

export type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
    details: ApiErrorDetails;
  };
};

type ApiPayload<T> = ApiDataPayload<T> | ApiErrorPayload;

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);
const DEFAULT_LOCAL_API_BASE_URL = "http://127.0.0.1:8080";
const API_TIMEOUT_MS = 8_000;

const trimTrailingSlash = (value: string) => value.replace(/\/$/, "");

export const getApiBaseUrl = () => {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    return window.location.origin;
  }

  if (!configuredBaseUrl) {
    return DEFAULT_LOCAL_API_BASE_URL;
  }

  if (typeof window === "undefined") {
    return trimTrailingSlash(configuredBaseUrl);
  }

  const apiUrl = new URL(configuredBaseUrl);
  const appHostname = window.location.hostname;

  if (LOCAL_HOSTS.has(apiUrl.hostname) && LOCAL_HOSTS.has(appHostname)) {
    apiUrl.hostname = appHostname;
  }

  return trimTrailingSlash(apiUrl.toString());
};

class ApiTransportError extends Error {
  readonly kind: "network" | "timeout";

  constructor(kind: "network" | "timeout", message: string) {
    super(message);
    this.name = "ApiTransportError";
    this.kind = kind;
  }
}

const fetchWithPolicy: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, API_TIMEOUT_MS);
  const parentSignal = init?.signal;
  const abortFromParent = () => controller.abort(parentSignal?.reason);

  if (parentSignal) {
    if (parentSignal.aborted) {
      abortFromParent();
    } else {
      parentSignal.addEventListener("abort", abortFromParent, { once: true });
    }
  }

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut) {
      throw new ApiTransportError(
        "timeout",
        `API request timed out after ${API_TIMEOUT_MS}ms`
      );
    }

    throw new ApiTransportError(
      "network",
      error instanceof Error ? error.message : "Network request failed"
    );
  } finally {
    clearTimeout(timeout);
    parentSignal?.removeEventListener("abort", abortFromParent);
  }
};

export const apiClient = hc<AppType>(getApiBaseUrl(), {
  fetch: fetchWithPolicy,
  init: {
    credentials: "include",
  },
});

export type AppApiClient = typeof apiClient;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isApiErrorCode = (value: string): value is ApiErrorCode =>
  [
    "validation_error",
    "authentication_error",
    "forbidden",
    "not_found",
    "conflict",
    "internal_error",
  ].includes(value);

const toDetails = (value: unknown): ApiErrorDetails =>
  isRecord(value) ? value : {};

const toApiError = (payload: unknown, status: number): ApiError => {
  if (isRecord(payload) && isRecord(payload.error)) {
    const message =
      typeof payload.error.message === "string"
        ? payload.error.message
        : "API request failed";
    const code =
      typeof payload.error.code === "string" &&
      isApiErrorCode(payload.error.code)
        ? payload.error.code
        : null;

    return new ApiError(
      message,
      status,
      code,
      toDetails(payload.error.details)
    );
  }

  return new ApiError("API request failed", status);
};

const decodeJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    throw new ApiError(
      "API response could not be decoded",
      response.status,
      null,
      {},
      "decode",
      false
    );
  }
};

export const parseDataResponse = async <T>(
  response: ClientResponse<ApiPayload<T>>
): Promise<T> => {
  const payload = await decodeJson(response);

  if (!response.ok) {
    throw toApiError(payload, response.status);
  }

  if (!isRecord(payload) || !("data" in payload)) {
    throw new ApiError(
      "API response envelope is invalid",
      response.status,
      null,
      {},
      "decode"
    );
  }

  return payload.data as T;
};

export const parseNoContentResponse = async (
  response: ClientResponse<unknown>
) => {
  if (response.status === 204) {
    return;
  }

  const payload = await decodeJson(response);
  if (!response.ok) {
    throw toApiError(payload, response.status);
  }

  throw new ApiError(
    "Expected a 204 response",
    response.status,
    null,
    {},
    "decode"
  );
};

export const ensureOk = async (response: ClientResponse<ApiPayload<unknown>>) =>
  parseNoContentResponse(response);

export const executeApiRequest = async <T>(
  operation: () => Promise<ClientResponse<ApiPayload<T>>>
): Promise<T> => {
  try {
    return await parseDataResponse(await operation());
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof ApiTransportError) {
      throw new ApiError(error.message, null, null, {}, error.kind, true);
    }

    throw new ApiError("API request failed", null, null, {}, "network", true);
  }
};

export const executeNoContentRequest = async (
  operation: () => Promise<ClientResponse<unknown>>
) => {
  try {
    await parseNoContentResponse(await operation());
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof ApiTransportError) {
      throw new ApiError(error.message, null, null, {}, error.kind, true);
    }

    throw new ApiError("API request failed", null, null, {}, "network", true);
  }
};

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!(error instanceof ApiError)) {
    return fallback;
  }

  if (error.status === 401 || error.code === "authentication_error") {
    return "ログイン状態を確認できません。再度ログインしてください。";
  }

  if (error.status === 403 || error.code === "forbidden") {
    return "この操作を実行する権限がありません。";
  }

  if (error.status === 404 || error.code === "not_found") {
    return "対象のデータが見つかりません。";
  }

  if (error.status === 409 || error.code === "conflict") {
    return "現在の状態ではこの操作を実行できません。";
  }

  if (error.retryable) {
    return "通信に失敗しました。時間をおいて再度お試しください。";
  }

  return fallback;
};
