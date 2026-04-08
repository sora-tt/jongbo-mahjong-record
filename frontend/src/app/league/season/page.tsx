"use client";

import * as React from "react";

import clsx from "clsx";
import { BookOpen, Calendar, Crown } from "lucide-react";

import Header from "@/components/common/container/header";
import { LeagueRankingTable } from "@/components/pages/league/league-ranking-table";
import { Button } from "@/components/ui/button";
import { HeaderCard } from "@/components/ui/header-card";
import { SectionCard } from "@/components/ui/section-card";

import { useLeague } from "./hooks";

import { COLOR_MAP } from "@/constants/color-map";

const SeasonPage: React.FC = () => {
  const { league, error } = useLeague();

  if (error) {
    return (
      <div className="flex-1 bg-white min-h-full font-jp">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!league) return null;

  const { name, createdAt, lastRecordedAt, rule, totalGames, members, titles } =
    league;

  return (
    <div className="flex-1 bg-white min-h-full font-jp">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-6">
          <HeaderCard title={name} align="center">
            <span className="inline-flex items-center gap-1">
              <Calendar size={14} className="text-white" />
              <span>
                {createdAt.format("yyyy/MM/dd")} 〜{" "}
                {lastRecordedAt.format("yyyy/MM/dd")}
              </span>
            </span>
            <span className="inline-flex items-center gap-1">
              <BookOpen size={14} className="text-white" />
              <span>{rule.name}</span>
            </span>
          </HeaderCard>
        </section>

        <section className="mb-6">
          <div className="flex gap-3">
            <Button variant="brand-primary">更新する</Button>
            <Button variant="brand-secondary">記録する</Button>
          </div>
        </section>

        <section className="mb-8">
          <SectionCard
            title="順位表"
            rightText={`総対局数：${totalGames}`}
            bodyClassName="p-4 overflow-x-auto"
          >
            <LeagueRankingTable />
          </SectionCard>
        </section>

        <section className="mb-8">
          <SectionCard title="総合pt推移" bodyClassName="p-4">
            <div className="w-full h-48 bg-gray-50 rounded-md mb-3" />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {Object.values(members).map((member) => (
                <div
                  key={member.player.userId}
                  className="flex items-center gap-1"
                >
                  <span
                    className={clsx(
                      "inline-block w-2 h-2 rounded-full",
                      COLOR_MAP[member.player.color] ?? "bg-gray-500"
                    )}
                  />
                  <span className="text-text-muted">{member.player.name}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-text-muted">
              ※プレイヤー名をタップするとデータを非表示にできます
            </p>
          </SectionCard>
        </section>

        <section className="mb-8">
          <SectionCard title="タイトル" bodyClassName="p-4">
            <div>
              {titles ? (
                titles.map((t) => (
                  <div
                    key={t.label}
                    className="grid grid-cols-3 gap-x-4 px-4 py-2 text-sm border-b border-pink-200 last:border-b-0 items-center text-text-muted"
                  >
                    <div className="text-left">{t.label}</div>
                    <div className="flex items-center justify-center gap-1">
                      <Crown size={16} className="text-yellow-400" />
                      <span className="font-semibold">{t.playerName}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{t.value}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div>No title</div>
              )}
            </div>
          </SectionCard>
        </section>
      </div>
    </div>
  );
};

export default SeasonPage;
