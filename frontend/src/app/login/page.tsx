"use client";

import * as React from "react";

import { AuthFormShell } from "@/components/pages/auth/auth-form-shell";
import { InputArea } from "@/components/pages/entry-pages/input-area";

import { useLoginPage } from "./hooks";

const LoginPage: React.FC = () => {
  const {
    email,
    password,
    error,
    isSubmitting,
    setEmail,
    setPassword,
    handleSubmit,
  } = useLoginPage();

  return (
    <AuthFormShell
      title="ログイン"
      error={error}
      submitLabel="ログイン"
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      footerLinks={[
        { href: "/", label: "パスワードを忘れた方はこちら" },
        { href: "/signup", label: "新規登録はこちら" },
      ]}
    >
      <InputArea
        label="メールアドレス"
        type="email"
        placeholder="メールアドレスを入力"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <InputArea
        label="パスワード"
        type="password"
        placeholder="パスワードを入力"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
    </AuthFormShell>
  );
};

export default LoginPage;
