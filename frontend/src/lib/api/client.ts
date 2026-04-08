type RequestOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
};

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

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

const getApiBaseUrl = () => {
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

const buildHeaders = async (headers?: HeadersInit) => {
  const nextHeaders = new Headers(headers);

  if (!nextHeaders.has("Content-Type")) {
    nextHeaders.set("Content-Type", "application/json");
  }

  return nextHeaders;
};

export const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> => {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    credentials: "include",
    headers: await buildHeaders(options.headers),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = (await response.json().catch(() => null)) as {
    data?: T;
    error?: { message?: string; code?: string; details?: unknown };
  } | null;

  if (!response.ok) {
    throw new ApiError(
      payload?.error?.message ?? "API request failed",
      response.status,
      payload?.error?.code,
      payload?.error?.details
    );
  }

  return payload?.data as T;
};

export type UserProfile = {
  id: string;
  username: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export const createSession = async (idToken: string) =>
  apiRequest<{ authenticated: boolean; expiresAt: string }>(
    "/api/auth/session",
    {
      method: "POST",
      body: { idToken },
    }
  );

export const deleteSession = async () =>
  apiRequest<null>("/api/auth/session", {
    method: "DELETE",
  });

export const createMe = async (input: { name: string; username: string }) =>
  apiRequest<UserProfile>("/api/users/me", {
    method: "POST",
    body: input,
  });

export const fetchMe = async () =>
  apiRequest<UserProfile>("/api/users/me", {
    method: "GET",
  });
