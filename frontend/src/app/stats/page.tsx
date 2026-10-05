"use client";

import * as React from "react";

import { StatisticsPageContent } from "@/features/statistics/ui/StatisticsPageContent";

import { AppShell } from "@/components/layout/app-shell";
import { LoadingState } from "@/components/ui/loading-state";

const StatisticsPage: React.FC = () => (
  <React.Suspense
    fallback={
      <AppShell mainClassName="min-h-screen bg-background font-jp">
        <div className="mx-auto flex max-w-md flex-col gap-5 px-4 py-6">
          <LoadingState label="成績を開いています…" className="min-h-40" />
        </div>
      </AppShell>
    }
  >
    <StatisticsPageContent />
  </React.Suspense>
);

export default StatisticsPage;
