"use client";
import * as React from "react";

import { StatisticsPageContent } from "@/features/statistics/ui/page-content";

import { AppShell } from "@/components/layout/app-shell";
import { PageLoading } from "@/components/ui/page-loading";

const StatisticsPage = () => {
  return (
    <React.Suspense
      fallback={
        <AppShell bottomNav activeNav="statistics">
          <PageLoading label="成績を読み込んでいます" bottomNav />
        </AppShell>
      }
    >
      <StatisticsPageContent />
    </React.Suspense>
  );
};

export default StatisticsPage;
