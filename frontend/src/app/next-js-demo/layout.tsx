import * as React from "react";

import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const NextJsDemoLayout: React.FC<NextJsDemoLayoutProps> = ({
  children,
}) => {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      {children}
    </div>
  );
};

type NextJsDemoLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default NextJsDemoLayout;
