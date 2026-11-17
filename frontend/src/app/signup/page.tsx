"use client";

import { useSignupPage } from "@/features/auth/hooks/use-signup";

import { AuthForm } from "@/components/layout/auth-form";
import { Input } from "@/components/ui/input";

const SignUpPage = () => {
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
    <AuthForm
      title="新規登録"
      error={error}
      submitLabel="アカウントを作成"
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      links={[{ href: "/login", label: "ログインはこちら" }]}
    >
      <Input
        label="メールアドレス"
        type="email"
        placeholder="メールアドレスを入力"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Input
        label="表示名"
        type="text"
        placeholder="表示名を入力"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <Input
        label="ユーザーネーム"
        type="text"
        placeholder="ユーザーネームを入力"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
      />
      <Input
        label="パスワード"
        type="password"
        placeholder="8文字以上のパスワード"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <p className="text-app-caption text-app-text-secondary">
        英字・数字を含むパスワード
      </p>
    </AuthForm>
  );
};

export default SignUpPage;
