"use client";

import * as React from "react";

import clsx from "clsx";
import { Calendar, Crown } from "lucide-react";

import { COLOR_MAP } from "@/constants/color-map";

import Header from "@/components/common/container/header";
import { LeagueRankingTable } from "@/components/pages/league/league-ranking-table";
import { Button } from "@/components/ui/button";
import { HeaderCard } from "@/components/ui/header-card";
import { SectionCard } from "@/components/ui/section-card";

import { useSeasonPage } from "./hooks";

const formatDate = (value: string | null) => {
  if (!value) {
    return "未記録";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
};

const SeasonPage: React.FC = () => {
  const { season, titles, loading, error, handleStartRecording } =
    useSeasonPage();

  if (loading) {
    return (
      <div className="flex-1 bg-white min-h-full font-jp">
        <Header />
        <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4 text-center text-text-muted">
          シーズン情報を読み込んでいます...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-white min-h-full font-jp">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-error-bg border-2 border-error-border rounded-lg p-4">
            <p className="text-error-text text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!season) return null;

  return (
    <div className="flex-1 bg-white min-h-full font-jp">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-6">
          <HeaderCard title={season.name} align="center">
            <span className="inline-flex items-center gap-1">
              <Calendar size={14} className="text-white" />
              <span>
                {formatDate(season.createdAt)} 〜{" "}
                {formatDate(season.latestPlayedAt)}
              </span>
            </span>
          </HeaderCard>
        </section>

        <section className="mb-6">
          <div className="flex gap-3">
            <Button variant="brand-primary">更新する</Button>
            <Button variant="brand-secondary" onClick={handleStartRecording}>
              記録する
            </Button>
          </div>
        </section>

        <section className="mb-8">
          <SectionCard
            title="順位表"
            rightText={`総対局数：${season.totalMatchCount}`}
            bodyClassName="p-4 overflow-x-auto"
          >
            <LeagueRankingTable members={season.standings} />
          </SectionCard>
        </section>

        <section className="mb-8">
          <SectionCard title="総合pt推移" bodyClassName="p-4">
            <div className="w-full h-48 bg-gray-50 rounded-md mb-3" />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {season.pointProgressions.map((progression, index) => (
                <div
                  key={progression.userId}
                  className="flex items-center gap-1"
                >
                  <span
                    className={clsx(
                      "inline-block w-2 h-2 rounded-full",
                      Object.values(COLOR_MAP)[
                        index % Object.values(COLOR_MAP).length
                      ]
                    )}
                  />
                  <span className="text-text-muted">
                    {progression.userName}
                  </span>
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
              {titles.length > 0 ? (
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
