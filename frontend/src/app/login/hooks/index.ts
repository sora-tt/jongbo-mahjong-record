"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { loginToApp } from "@/lib/auth/flows";
import { clearAuthDebugLogs, logAuthDebug } from "@/lib/debug/auth-debug";

export const useLoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    clearAuthDebugLogs();
    logAuthDebug("loginPage:submit");
    setError(null);
    setIsSubmitting(true);

    try {
      const nextPath = await loginToApp({ email, password });
      logAuthDebug("loginPage:nextPath", { nextPath });
      router.replace(nextPath);
    } catch (submitError) {
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
