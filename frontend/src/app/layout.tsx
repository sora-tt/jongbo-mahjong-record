import * as React from "react";

import "./styles/globals.css";

import { Metadata } from "next";

import { AppProviders } from "@/components/app/providers";

export const metadata: Metadata = {
  title: "jongbo | 麻雀記録",
  description: "麻雀のリーグ・対局・成績を記録するアプリ",
};

export const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <html lang="ja">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default RootLayout;
