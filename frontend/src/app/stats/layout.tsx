import type { ReactNode } from "react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "個人成績 | jongbo",
  description: "麻雀の個人成績を確認できます。",
};

const StatisticsLayout = ({ children }: Readonly<{ children: ReactNode }>) =>
  children;

export default StatisticsLayout;
