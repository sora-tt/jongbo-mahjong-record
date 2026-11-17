"use client";

import { useLoginPage } from "@/features/auth/hooks/use-login";

import { AuthForm } from "@/components/layout/auth-form";
import { Input } from "@/components/ui/input";

const LoginPage = () => {
  const {
    email,
    password,
    error,
    isSubmitting,
    setEmail,
    setPassword,
    handleSubmit,
  } = useLoginPage({
    showLoadingAnimation: true,
    homePath: "/",
    verificationPath: "/verify-email",
  });
  return (
    <AuthForm
      title="ログイン"
      error={error}
      submitLabel="ログイン"
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      links={[
        { href: "/", label: "パスワードを忘れた方はこちら", secondary: true },
        { href: "/signup", label: "新規登録はこちら" },
      ]}
    >
      <Input
        label="メールアドレス"
        type="email"
        placeholder="入力してください"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Input
        label="パスワード"
        type="password"
        placeholder="入力してください"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
    </AuthForm>
  );
};

export default LoginPage;
