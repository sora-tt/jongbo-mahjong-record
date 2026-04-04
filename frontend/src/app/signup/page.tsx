"use client";

import * as React from "react";

import { AuthFormShell } from "@/components/pages/auth/auth-form-shell";
import { InputArea } from "@/components/pages/entry-pages/input-area";
import { useSignupPage } from "./hooks";

const SignUpPage: React.FC = () => {
  const {
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
  } = useSignupPage();

  return (
    <AuthFormShell
      title="新規登録"
      error={error}
      submitLabel="アカウントを作成"
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      footerLinks={[{ href: "/login", label: "ログインはこちら" }]}
    >
      <InputArea
        label="メールアドレス"
        type="email"
        placeholder="メールアドレスを入力"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <InputArea
        label="表示名"
        type="text"
        placeholder="表示名を入力"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <InputArea
        label="ユーザーネーム"
        type="text"
        placeholder="ユーザーネームを入力"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
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

export default SignUpPage;
