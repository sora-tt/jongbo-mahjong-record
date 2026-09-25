"use client";

import * as React from "react";

import type { ApiError } from "@/lib/api/core";

export type AsyncState<T> =
  | { status: "idle"; data: null; error: null }
  | { status: "loading"; data: T | null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: T | null; error: ApiError };

type Request = (signal: AbortSignal) => Promise<unknown>;

export const useApiRequest = <T>() => {
  const [state, setState] = React.useState<AsyncState<T>>({
    status: "idle",
    data: null,
    error: null,
  });
  const requestId = React.useRef(0);
  const controller = React.useRef<AbortController | null>(null);

  const execute = React.useCallback(async (request: Request) => {
    controller.current?.abort();
    const nextController = new AbortController();
    controller.current = nextController;
    const currentRequestId = ++requestId.current;

    setState((current) => ({
      status: "loading",
      data: current.data,
      error: null,
    }));

    try {
      const data = (await request(nextController.signal)) as T;
      if (currentRequestId !== requestId.current) {
        return null;
      }

      setState({ status: "success", data, error: null });
      return data;
    } catch (error) {
      if (
        nextController.signal.aborted ||
        currentRequestId !== requestId.current
      ) {
        return null;
      }

      const apiError =
        error instanceof Error
          ? (error as ApiError)
          : new Error("API request failed");
      setState((current) => ({
        status: "error",
        data: current.data,
        error: apiError as ApiError,
      }));
      return null;
    }
  }, []);

  const reset = React.useCallback(() => {
    requestId.current += 1;
    controller.current?.abort();
    controller.current = null;
    setState({ status: "idle", data: null, error: null });
  }, []);

  React.useEffect(
    () => () => {
      requestId.current += 1;
      controller.current?.abort();
    },
    []
  );

  return { state, execute, reset };
};
