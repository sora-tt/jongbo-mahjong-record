"use client";

import * as React from "react";

import { Calendar, BookOpen } from "lucide-react";

import { DailyRecordTable } from "@/components/pages/daily-record/daily-record-table";
import { Button } from "@/components/ui/button";
import { HeaderCard } from "@/components/ui/header-card";
import { SectionCard } from "@/components/ui/section-card";

import { useDailyRecord } from "./hooks";

export const DailyRecordPage: React.FC = () => {
  const { dateLabel, ruleLabel, players, sortedMatches, totals } =
    useDailyRecord();

  return (
    <div className="flex-1 bg-white min-h-full font-jp">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <section className="mb-6">
          <HeaderCard title="本日の成績">
            <span className="inline-flex items-center gap-1">
              <Calendar size={14} className="text-white" />
              <span>{dateLabel}</span>
            </span>
            {ruleLabel && (
              <span className="inline-flex items-center gap-1">
                <BookOpen size={14} className="text-white" />
                <span>{ruleLabel}</span>
              </span>
            )}
          </HeaderCard>
        </section>

        {/* 成績表 */}
        <section className="mb-10">
          <SectionCard title="成績表" bodyClassName="p-0 overflow-x-auto">
            <DailyRecordTable
              players={players}
              matches={sortedMatches}
              totals={totals}
            />
          </SectionCard>
        </section>

        {/* ボタン */}
        <section className="mb-6">
          <div className="flex flex-col items-center gap-3">
            <Button variant="brand-secondary" className="w-40 flex-none">
              記録を追加
            </Button>
            <Button className="w-40 flex-none">記録を終了</Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DailyRecordPage;
