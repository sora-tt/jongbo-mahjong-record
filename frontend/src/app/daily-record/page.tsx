"use client";

import * as React from "react";

import { Calendar, BookOpen } from "lucide-react";

import { DailyRecordTable } from "@/components/pages/daily-record/daily-record-table";
import Button from "@/components/ui/button";
import { HeaderCard } from "@/components/ui/header-card";
import { SectionCard } from "@/components/ui/section-card";

import { useDailyRecord } from "./hooks";

import { leaguesData } from "@/mocks/league";

export const DailyRecordPage: React.FC = () => {
  const { record, error } = useDailyRecord();

  if (error) {
    return (
      <div className="flex-1 bg-white min-h-full font-jp">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!record) return null;

  const { matches, leagueId, date } = record;

  const league = leaguesData.find((l) => l.id === leagueId);
  const dateLabel = date.format("yyyy/MM/dd");
  const ruleLabel = league?.ruleName ?? "";

  const sortedMatchIndexes = Object.keys(matches)
    .map((k) => Number(k))
    .sort((a, b) => a - b);

  const sortedMatches = sortedMatchIndexes.map((idx) => ({
    index: idx,
    match: matches[idx],
  }));

  const firstMatch = sortedMatches[0]?.match;
  const WIND_ORDER = ["EAST", "SOUTH", "WEST", "NORTH"] as const;

  const players =
    firstMatch != null
      ? WIND_ORDER.map(
          (windKey) => firstMatch.results.matchResultInput[windKey].player
        )
      : [];

  const totals = players.map((player) =>
    sortedMatches.reduce((sum, { match }) => {
      const input = match.results.matchResultInput;
      const resultArray = WIND_ORDER.map((w) => input[w]);
      const resultForPlayer = resultArray.find(
        (r) => r.player.id === player.id
      );
      const pt = resultForPlayer?.score ?? 0;
      return sum + pt;
    }, 0)
  );

  return (
    <div className="flex-1 bg-white min-h-full font-jp">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <section className="mb-6">
          <HeaderCard
            title="本日の成績"
            metaItems={[
              {
                icon: <Calendar size={14} className="text-white" />,
                label: dateLabel,
              },
              ...(ruleLabel
                ? [
                    {
                      icon: <BookOpen size={14} className="text-white" />,
                      label: ruleLabel,
                    },
                  ]
                : []),
            ]}
          />
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

        {/* ボタン（リーグ画面と同じデザイン） */}
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
