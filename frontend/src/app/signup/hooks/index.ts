"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signupToApp } from "@/lib/auth/flows";

const REQUIRED_FIELDS_ERROR = "メールアドレス、表示名、ユーザーネーム、パスワードを入力してください";

export const useSignupPage = () => {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !name.trim() || !username.trim() || !password) {
      setError(REQUIRED_FIELDS_ERROR);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await signupToApp({
        email,
        password,
        name,
        username,
      });
      router.replace("/home");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "アカウント作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    email,
    name,
    username,
    password,
    error,
    isSubmitting,
    setEmail,
    setName,
    setUsername,
    setPassword,
    handleSubmit,
  };
};
