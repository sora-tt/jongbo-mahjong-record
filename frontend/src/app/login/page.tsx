"use client";

import * as React from "react";

import { Spacer } from "@/components/common/ui/spacer";
import { InputArea } from "@/components/pages/entry-pages/input-area";
import { LinkArea } from "@/components/pages/entry-pages/link-area";

const LoginPage: React.FC = () => {
  return (
    <Spacer
      minHeight="screen"
      display="flex"
      className="items-center justify-center bg-white text-black"
    >
      <Spacer
        display="flex flex-col"
        gap="xsmall"
        padding="medium"
        rounded="lg"
        border={{ color: "brand-200", width: "2" }}
      >
        <Spacer>
          <h3 className="text-center text-lg font-bold">ログイン</h3>
        </Spacer>
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
        {/* 
        TODO: 
        - Set up onClick handler for the login button
        - Use CustomButton component
        */}
        <button
          className="w-full bg-brand-500 text-white py-2 rounded hover:opacity-90"
          onClick={() => {}}
        >
          ログイン
        </button>
        <LinkArea attrs={{ href: "/" }}>パスワードを忘れた方はこちら</LinkArea>
        <LinkArea attrs={{ href: "/sign-up" }}>新規登録はこちら</LinkArea>
      </Spacer>
    </Spacer>
  );
};

export default LoginPage;
