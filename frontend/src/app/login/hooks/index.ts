"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { loginToApp } from "@/lib/auth/flows";

export const useLoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    console.info("[auth-debug]", "loginPage:submit");
    setError(null);
    setIsSubmitting(true);

    try {
      const nextPath = await loginToApp({ email, password });
      console.info("[auth-debug]", "loginPage:nextPath", { nextPath });
      router.replace(nextPath);
    } catch (submitError) {
      console.error("[auth-debug]", "loginPage:error", {
        error:
          submitError instanceof Error
            ? {
                name: submitError.name,
                message: submitError.message,
              }
            : submitError,
      });
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
