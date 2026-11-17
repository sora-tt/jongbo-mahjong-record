"use client";

import * as React from "react";

import { confirmVerificationEmail, createSession } from "@/lib/api/auth";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";
import {
  getVerificationAction,
  shouldAutoSendVerificationEmail,
} from "@/lib/auth/verification";
import { getCurrentUser, sendVerificationEmail } from "@/lib/firebase/auth";

const VERIFICATION_PATH = "/v2/verify-email";
const COOLDOWN_SECONDS = 60;

const defaultApi = {
  confirm: confirmVerificationEmail,
  getCurrentUser,
  send: sendVerificationEmail,
  refreshSession: createSession,
};

export const createUseEmailVerification =
  (api: typeof defaultApi = defaultApi) =>
  (search: string) => {
    const [status, setStatus] = React.useState<
      "checking" | "pending" | "success" | "error" | "session-error"
    >("checking");
    const [error, setError] = React.useState<string | null>(null);
    const [retryAfterSeconds, setRetryAfterSeconds] = React.useState(0);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const initializedSearch = React.useRef<string | null>(null);
    const sending = React.useRef(false);

    const resend = React.useCallback(async () => {
      if (sending.current) return;
      sending.current = true;
      setIsSubmitting(true);
      setError(null);
      try {
        const user = await api.getCurrentUser();
        if (!user) {
          setStatus("error");
          setError("ログイン状態が無効です。ログインし直してください。");
          return;
        }
        await api.send(user, VERIFICATION_PATH);
        setRetryAfterSeconds(COOLDOWN_SECONDS);
        setStatus("pending");
      } catch (sendError) {
        if (
          (sendError instanceof ApiError && sendError.status === 429) ||
          (sendError &&
            typeof sendError === "object" &&
            "code" in sendError &&
            sendError.code === "auth/too-many-requests")
        ) {
          const retryAfter =
            sendError instanceof ApiError
              ? Number(sendError.details.retryAfterSeconds)
              : 0;
          setRetryAfterSeconds(
            Number.isFinite(retryAfter) && retryAfter > 0
              ? retryAfter
              : COOLDOWN_SECONDS
          );
          setStatus("pending");
        } else {
          setStatus("error");
          setError(
            getApiErrorMessage(sendError, "認証メールの送信に失敗しました。")
          );
        }
      } finally {
        sending.current = false;
        setIsSubmitting(false);
      }
    }, []);

    React.useEffect(() => {
      if (initializedSearch.current === search) return;
      initializedSearch.current = search;
      const action = getVerificationAction(search);
      setStatus("checking");
      setError(null);

      void (async () => {
        if (action.mode === "verify") {
          if (!action.oobCode) {
            setStatus("error");
            setError(
              "認証コードが見つかりませんでした。再度メールを送信してください。"
            );
            return;
          }
          try {
            await api.confirm(action.oobCode);
          } catch (confirmError) {
            setStatus("error");
            setError(
              getApiErrorMessage(
                confirmError,
                "認証に失敗しました。新しいメールを再送信してください。"
              )
            );
            return;
          }
          try {
            const user = await api.getCurrentUser();
            if (user) {
              await user.reload();
              if (user.emailVerified) {
                await api.refreshSession(await user.getIdToken(true));
              }
            }
            setStatus("success");
          } catch {
            setStatus("session-error");
            setError(
              "認証は完了しましたが、ログイン状態を更新できませんでした。ログインし直してください。"
            );
          }
          return;
        }

        try {
          const user = await api.getCurrentUser();
          if (user) {
            await user.reload();
            if (user.emailVerified) {
              try {
                await api.refreshSession(await user.getIdToken(true));
                setStatus("success");
              } catch {
                setStatus("session-error");
                setError(
                  "認証は完了しましたが、ログイン状態を更新できませんでした。ログインし直してください。"
                );
              }
              return;
            }
          }
          if (shouldAutoSendVerificationEmail(search)) {
            await resend();
          } else {
            setRetryAfterSeconds(COOLDOWN_SECONDS);
            setStatus("pending");
          }
        } catch {
          setStatus("error");
          setError(
            "認証状態を確認できませんでした。ログインし直してください。"
          );
        }
      })();
    }, [search, resend]);

    React.useEffect(() => {
      if (retryAfterSeconds <= 0) return;
      const timer = window.setInterval(
        () => setRetryAfterSeconds((value) => Math.max(0, value - 1)),
        1000
      );
      return () => window.clearInterval(timer);
    }, [retryAfterSeconds]);

    return { status, error, retryAfterSeconds, isSubmitting, resend };
  };

export const useEmailVerification = createUseEmailVerification();
