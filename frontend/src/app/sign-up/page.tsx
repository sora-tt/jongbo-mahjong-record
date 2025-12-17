"use client";

import * as React from "react";

import { Spacer } from "@/components/common/ui/spacer";
import { InputArea } from "@/components/pages/entry-pages/input-area";
import { LinkArea } from "@/components/pages/entry-pages/link-area";

/**
 * TODO:
 * This page is using the same layout and components as LoginPage.
 * However, we should create a specific design for SignUpPage in the future.
 */
const SignUpPage: React.FC = () => {
  return (
    <Spacer
      minHeight="screen"
      display="flex"
      backGround="white"
      className="items-center justify-center text-black"
    >
      <Spacer
        display="flex flex-col"
        gap="xsmall"
        padding="medium"
        rounded="lg"
        border={{ color: "brand-200", width: "2" }}
      >
        <Spacer>
          <h3 className="text-center text-lg font-bold">新規登録</h3>
        </Spacer>
        <InputArea
          label="ユーザー名"
          type="text"
          placeholder="ユーザー名を入力"
          onChange={() => {}}
        />
        <InputArea
          label="メールアドレス"
          type="email"
          placeholder="メールアドレスを入力"
          onChange={() => {}}
        />
        <InputArea
          label="パスワード"
          type="password"
          placeholder="パスワードを入力"
          onChange={() => {}}
        />
        <InputArea
          label="パスワード（確認用）"
          type="password"
          placeholder="もう一度パスワードを入力"
          onChange={() => {}}
        />
        <button
          className="w-full bg-brand-500 text-white py-2 rounded hover:opacity-90"
          onClick={() => {}}
        >
          アカウントを作成
        </button>
        <LinkArea attrs={{ href: "/login" }}>ログインはこちら</LinkArea>
      </Spacer>
    </Spacer>
  );
};

export default SignUpPage;
