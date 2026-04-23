import { hc, type ClientResponse } from "hono/client";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type AppType = import("mahjong-record-app-backend").AppType;

type ApiErrorPayload = {
  error?: {
    message?: string;
    code?: string;
    details?: unknown;
  };
};

type ApiDataPayload<T> = {
  data: T;
};

const hasErrorPayload = (
  payload: ApiDataPayload<unknown> | ApiErrorPayload | null
): payload is ApiErrorPayload => payload !== null && "error" in payload;

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

export const getApiBaseUrl = () => {
  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8080";

  if (typeof window === "undefined") {
    return configuredBaseUrl;
  }

  const apiUrl = new URL(configuredBaseUrl);
  const appHostname = window.location.hostname;

  if (LOCAL_HOSTS.has(apiUrl.hostname) && LOCAL_HOSTS.has(appHostname)) {
    apiUrl.hostname = appHostname;
  }

  return apiUrl.toString().replace(/\/$/, "");
};

export const apiClient = hc<AppType>(getApiBaseUrl(), {
  init: {
    credentials: "include",
  },
});

export const parseDataResponse = async <T>(
  response: ClientResponse<ApiDataPayload<T> | ApiErrorPayload>
): Promise<T> => {
  const payload = (await response.json().catch(() => null)) as
    | ApiDataPayload<T>
    | ApiErrorPayload
    | null;

  if (!response.ok) {
    throw new ApiError(
      hasErrorPayload(payload)
        ? (payload.error?.message ?? "API request failed")
        : "API request failed",
      response.status,
      hasErrorPayload(payload) ? payload.error?.code : undefined,
      hasErrorPayload(payload) ? payload.error?.details : undefined
    );
  }

  return (payload as ApiDataPayload<T>).data;
};

export const ensureOk = async (response: Response) => {
  if (response.ok) {
    return;
  }

  const payload = (await response
    .json()
    .catch(() => null)) as ApiErrorPayload | null;

  throw new ApiError(
    payload?.error?.message ?? "API request failed",
    response.status,
    payload?.error?.code,
    payload?.error?.details
  );
};
