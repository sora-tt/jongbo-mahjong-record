import { NextResponse } from "next/server";

const PROXY_TIMEOUT_MS = 8000;

const normalizeBackendUrl = (value: string) => {
  const withProtocol =
    value.startsWith("http://") || value.startsWith("https://")
      ? value
      : `https://${value}`;

  return withProtocol.replace(/\/$/, "");
};

const getBackendBaseUrl = () => {
  const url = process.env.BACKEND_VERCEL_URL?.trim();
  if (!url) {
    return null;
  }

  return normalizeBackendUrl(url);
};

const proxyRequest = async (
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) => {
  const backendBaseUrl = getBackendBaseUrl();
  if (!backendBaseUrl) {
    return NextResponse.json(
      {
        error: {
          code: "backend_not_configured",
          message: "backend url is not configured",
          details: {},
        },
      },
      { status: 500 }
    );
  }

  const requestUrl = new URL(request.url);
  const backendUrl = new URL(backendBaseUrl);
  if (requestUrl.host === backendUrl.host) {
    return NextResponse.json(
      {
        error: {
          code: "backend_url_invalid",
          message: "BACKEND_VERCEL_URL must not point to the frontend host",
          details: {
            frontendHost: requestUrl.host,
            configuredBackendHost: backendUrl.host,
          },
        },
      },
      { status: 500 }
    );
  }

  const { path = [] } = await context.params;
  const targetUrl = new URL(`${backendBaseUrl}/api/${path.join("/")}`);
  targetUrl.search = new URL(request.url).search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "AbortError" || error.message.includes("aborted"))
    ) {
      return NextResponse.json(
        {
          error: {
            code: "upstream_timeout",
            message: `backend request timed out after ${PROXY_TIMEOUT_MS}ms`,
            details: {
              target: targetUrl.toString(),
            },
          },
        },
        { status: 504 }
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");
  responseHeaders.delete("connection");

  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    responseHeaders.set("set-cookie", setCookie);
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
