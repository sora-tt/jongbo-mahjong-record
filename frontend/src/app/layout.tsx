import * as React from "react";

import "./styles/globals.css";

import { Metadata } from "next";

import { NavigationModelProvider } from "@/app/navigation-model-provider";

import { AppProviders } from "@/components/app/providers";

export const metadata: Metadata = {
  title: "jongbo | 麻雀記録",
  description: "麻雀のリーグ・対局・成績を記録するアプリ",
};

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <html lang="ja">
      <body>
        <AppProviders>
          <NavigationModelProvider>{children}</NavigationModelProvider>
        </AppProviders>
      </body>
    </html>
  );
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default RootLayout;
