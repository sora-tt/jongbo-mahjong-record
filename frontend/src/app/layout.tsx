import * as React from "react";

import "./styles/globals.css";

import { NavigationModelProvider } from "@/app/navigation-model-provider";
import { AppProviders } from "@/components/app/providers";

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "jongbo | 麻雀記録",
  description: "麻雀のリーグ・対局・成績を記録するアプリ",
  appleWebApp: {
    capable: true,
    title: "jongbo",
  },
  icons: {
    apple: {
      url: "/icons/jongbo-apple-touch.png",
      sizes: "180x180",
      type: "image/png",
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#e8736b",
  viewportFit: "cover",
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
