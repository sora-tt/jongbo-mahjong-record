"use client";

import { CircleAlert, CircleCheck } from "lucide-react";

import Link from "next/link";

import { useEmailVerification } from "@/features/auth/hooks/use-email-verification";
import { getRetryMessage } from "@/lib/auth/verification";

import { Button } from "@/components/v2/ui/button";
import { ButtonLink } from "@/components/v2/ui/button-link";
import { LoadingIcon } from "@/components/v2/ui/loading-icon";

export const EmailVerification = ({ search }: { search: string }) => {
  const { status, error, retryAfterSeconds, isSubmitting, resend } =
    useEmailVerification(search);
  const isChecking = status === "checking";
  const isSuccess = status === "success";
  return (
    <main className="box-border flex min-h-screen items-center justify-center bg-v2-canvas px-[44px] py-8 text-center supports-[height:100dvh]:min-h-dvh">
      <section
        className="w-full max-w-[302px]"
        aria-live="polite"
        aria-busy={isChecking || isSubmitting}
      >
        <h1 className="text-v2-display font-bold">
          {isChecking
            ? "認証を確認中"
            : isSuccess
              ? "メール認証が完了"
              : status === "session-error"
                ? "ログインが必要です"
                : status === "error"
                  ? "認証できませんでした"
                  : "メール認証"}
        </h1>
        {(isChecking ||
          isSuccess ||
          status === "error" ||
          status === "session-error") && (
          <div className="mt-4 flex justify-center text-v2-text-secondary">
            {isChecking ? (
              <LoadingIcon size={24} />
            ) : isSuccess ? (
              <CircleCheck size={24} aria-hidden="true" />
            ) : (
              <CircleAlert size={24} aria-hidden="true" />
            )}
          </div>
        )}
        <p
          className="mt-6 text-v2-body text-v2-text-secondary"
          role={error ? "alert" : undefined}
        >
          {error ??
            (isChecking
              ? "メールの認証リンクを確認しています。しばらくお待ちください。"
              : isSuccess
                ? "メールアドレスの認証が完了しました。アプリをご利用いただけます。"
                : "登録したメールアドレスに認証メールを送信しました。メール内のリンクから認証を完了してください。")}
        </p>
        {!isChecking && !isSuccess && status !== "session-error" && (
          <>
            <p className="mt-5 text-v2-caption text-v2-text-secondary">
              {error
                ? "ログイン状態や認証リンクを確認し、もう一度お試しください。"
                : "届かない場合は、迷惑メールフォルダをご確認ください。"}
            </p>
            <Button
              className="mt-4 !h-12"
              fullWidth
              disabled={retryAfterSeconds > 0}
              loading={isSubmitting}
              onClick={() => void resend()}
            >
              {isSubmitting
                ? "送信中…"
                : retryAfterSeconds > 0
                  ? getRetryMessage(retryAfterSeconds)
                  : "認証メールを再送する"}
            </Button>
            <Link
              href="/v2/login"
              className="mt-4 inline-flex min-h-11 items-center text-v2-label font-semibold text-v2-brand-strong"
            >
              ログイン画面へ戻る
            </Link>
          </>
        )}
        {status === "session-error" && (
          <ButtonLink href="/v2/login" className="mt-8 !h-12 w-full">
            ログイン画面へ戻る
          </ButtonLink>
        )}
        {isSuccess && (
          <ButtonLink href="/v2" className="mt-8 !h-12 w-full">
            ホームへ進む
          </ButtonLink>
        )}
      </section>
    </main>
  );
};
