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
    setError(null);
    setIsSubmitting(true);

    try {
      await loginToApp({ email, password });
      router.replace("/home");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "ログインに失敗しました");
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
