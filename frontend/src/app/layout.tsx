import * as React from "react";

import "./styles/globals.css";

import { AppProviders } from "@/components/app/providers";
import { ProfileProvider } from "@/components/layout/profile-provider";

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
      url: "/icons/jongbo-j-apple-touch.png",
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
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=M+PLUS+2:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <AppProviders>
          <ProfileProvider>{children}</ProfileProvider>
        </AppProviders>
      </body>
    </html>
  );
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default RootLayout;
