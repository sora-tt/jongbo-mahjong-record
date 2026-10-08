"use client";

import * as React from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { confirmVerificationEmail } from "@/lib/api/auth";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";
import {
  getAuthRedirectTarget,
  getRetryMessage,
  getVerificationAction,
  shouldAutoSendVerificationEmail,
} from "@/lib/auth/verification";
import {
  getCurrentUser,
  sendVerificationEmail as sendFirebaseVerificationEmail,
} from "@/lib/firebase/auth";

const VerifyEmailPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = React.useState<
    "checking" | "pending" | "success" | "error"
  >("pending");
  const [error, setError] = React.useState<string | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const refreshCooldown = React.useCallback((seconds: number) => {
    setRetryAfterSeconds(Math.max(0, seconds));
  }, []);

  const handleSendVerificationEmail = React.useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        setStatus("error");
        setError("ログイン状態が無効です。ログインし直してください。");
        return;
      }

      await sendFirebaseVerificationEmail(currentUser);
      refreshCooldown(60);
      setError(null);
      setStatus("pending");
    } catch (submitError) {
      const retryAfterSecondsFromError =
        submitError instanceof ApiError
          ? (submitError.details.retryAfterSeconds ?? 0)
          : 0;

      setError(
        getApiErrorMessage(submitError, "認証メールの送信に失敗しました")
      );
      setStatus("error");
      refreshCooldown(Number(retryAfterSecondsFromError));
    } finally {
      setIsSubmitting(false);
    }
  }, [refreshCooldown]);

  React.useEffect(() => {
    const action = getVerificationAction(searchParams.toString());

    if (action.mode === "verify") {
      setStatus("checking");
      setError(null);

      void (async () => {
        if (!action.oobCode) {
          setStatus("error");
          setError(
            "認証コードが見つかりませんでした。再度メールを送信してください。"
          );
          return;
        }

        try {
          await confirmVerificationEmail(action.oobCode);

          const currentUser = await getCurrentUser();
          if (currentUser) {
            await currentUser.reload();
          }

          setStatus("success");
          setError(null);
        } catch (confirmError) {
          setStatus("error");
          setError(
            getApiErrorMessage(
              confirmError,
              "認証に失敗しました。新しいメールを再送信してください。"
            )
          );
        }
      })();
      return;
    }

    if (shouldAutoSendVerificationEmail(searchParams.toString())) {
      void handleSendVerificationEmail();
    }
  }, [handleSendVerificationEmail, searchParams]);

  React.useEffect(() => {
    if (retryAfterSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setRetryAfterSeconds((currentRetrySeconds) => {
        const next = currentRetrySeconds - 1;
        return next <= 0 ? 0 : next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [retryAfterSeconds]);

  const shouldDisableResend = isSubmitting || retryAfterSeconds > 0;
  const buttonLabel =
    retryAfterSeconds > 0
      ? getRetryMessage(retryAfterSeconds)
      : isSubmitting
        ? "送信中..."
        : "認証メールを再送する";

  const actionLink = status === "success" ? "/" : "/login";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <section className="w-full max-w-lg rounded-surface border border-border bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-center text-2xl font-bold text-foreground">
          {status === "success"
            ? "メール認証が完了しました"
            : status === "checking"
              ? "認証を確認しています"
              : "メール認証を完了してください"}
        </h1>

        <div className="mt-6 space-y-4 text-sm text-text-muted">
          {status === "success" ? (
            <p className="rounded-control border border-success bg-success-soft px-3 py-2 text-success-text">
              認証が完了しました。アプリを利用できます。
            </p>
          ) : status === "checking" ? (
            <p>認証リンクの確認をしています。しばらくお待ちください。</p>
          ) : (
            <>
              <p>
                登録したメールアドレスに認証メールを送信しました。
                メール内のリンクを開いて認証を完了してください。
              </p>
              <p>
                認証が完了しない場合は、再送信ボタンから新しいメールを受け取れます。
              </p>
            </>
          )}

          {error ? (
            <p
              className="rounded-control border border-error-border bg-error-bg px-3 py-2 text-sm text-error-text"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </p>
          ) : null}
        </div>

        {status !== "success" ? (
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                void handleSendVerificationEmail();
              }}
              disabled={shouldDisableResend}
              className="rounded-control bg-brand-strong px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {buttonLabel}
            </button>
          </div>
        ) : null}

        <div className="mt-6 flex justify-center gap-4 text-sm">
          <Link
            href={actionLink}
            className="text-brand-strong underline-offset-4 hover:underline"
          >
            {status === "success" ? "ホームへ戻る" : "ログイン画面へ戻る"}
          </Link>
        </div>

        {status === "success" ? (
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => router.replace(getAuthRedirectTarget(true))}
              className="rounded-control border border-border px-4 py-2 text-sm text-foreground"
            >
              ホームへ進む
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
};

const VerifyEmailPage: React.FC = () => {
  return (
    <React.Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
          <section className="w-full max-w-lg rounded-surface border border-border bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-center text-2xl font-bold text-foreground">
              認証を確認しています
            </h1>
            <div className="mt-6 space-y-4 text-sm text-text-muted">
              <p>認証リンクの確認をしています。しばらくお待ちください。</p>
            </div>
          </section>
        </main>
      }
    >
      <VerifyEmailPageContent />
    </React.Suspense>
  );
};

export default VerifyEmailPage;
