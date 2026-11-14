"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { loginToApp } from "@/lib/auth/flows";
import { clearAuthDebugLogs, logAuthDebug } from "@/lib/debug/auth-debug";
import { useLoginLoading } from "@/providers/login-loading-provider";

export const useLoginPage = ({
  showLoadingAnimation = false,
  homePath = "/",
} = {}) => {
  const router = useRouter();
  const { start, finish } = useLoginLoading();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    clearAuthDebugLogs();
    logAuthDebug("loginPage:submit");
    setError(null);
    setIsSubmitting(true);
    if (showLoadingAnimation) start();

    try {
      const resultPath = await loginToApp({ email, password });
      const nextPath = resultPath === "/" ? homePath : resultPath;
      logAuthDebug("loginPage:nextPath", { nextPath });
      router.replace(nextPath);
    } catch (submitError) {
      if (showLoadingAnimation) finish();
      logAuthDebug(
        "loginPage:error",
        {
          error:
            submitError instanceof Error
              ? {
                  name: submitError.name,
                  message: submitError.message,
                }
              : submitError,
        },
        "error"
      );
      setError(
        submitError instanceof Error
          ? submitError.message
          : "ログインに失敗しました"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    email,
    password,
    error,
    isSubmitting,
    setEmail,
    setPassword,
    handleSubmit,
  };
};
