"use client";

import * as React from "react";

import Link from "next/link";

import Header from "@/components/common/container/header";

import { useLeaguePage } from "./hooks";
import { formatScore, formatStreak } from "../utils";

const LeaguePage: React.FC = () => {
  const {
    league,
    longestWinStreak,
    longestLoseStreak,
    currentHighestScore,
    currentLowestScore,
    leagueSeasons,
    loading,
    error,
  } = useLeaguePage();

  if (loading) {
    return (
      <div className="flex-1 bg-white min-h-screen font-jp">
        <Header />
        <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4 text-center text-text-muted">
          リーグ情報を読み込んでいます...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-white min-h-screen font-jp">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-error-bg border-2 border-error-border rounded-lg p-4">
            <p className="text-error-text text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!league) {
    return null;
  }

  return (
    <div className="flex-1 bg-white min-h-screen font-jp">
      <Header />
      <div className="flex flex-col max-w-7xl gap-4 mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-4">
          <div className="text-2xl font-bold text-text-dark">リーグ記録</div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="bg-white rounded-lg border-2 border-brand-200 p-4">
              <div className="text-sm font-bold text-text-muted mb-2">
                連勝記録
              </div>
              <div className="text-xs text-text-muted mb-2">
                {longestWinStreak?.userName || "データなし"}
              </div>
              <div className="text-3xl font-bold text-brand-600">
                {longestWinStreak
                  ? formatStreak({
                      count: longestWinStreak.value,
                      unit: "連勝",
                    })
                  : "データなし"}
              </div>
            </div>
            <div className="bg-white rounded-lg border-2 border-brand-200 p-4">
              <div className="text-sm font-bold text-text-muted mb-2">
                連敗記録
              </div>
              <div className="text-xs text-text-muted mb-2">
                {longestLoseStreak?.userName || "データなし"}
              </div>
              <div className="text-3xl font-bold text-brand-600">
                {longestLoseStreak
                  ? formatStreak({
                      count: longestLoseStreak.value,
                      unit: "連敗",
                    })
                  : "データなし"}
              </div>
            </div>
            <div className="bg-white rounded-lg border-2 border-brand-200 p-4">
              <div className="text-sm font-bold text-text-muted mb-2">
                最高スコア
              </div>
              <div className="text-xs text-text-muted mb-2">
                {currentHighestScore?.userName || "データなし"}
              </div>
              <div className="text-3xl font-bold text-brand-600">
                {currentHighestScore
                  ? formatScore({ score: currentHighestScore.value })
                  : "データなし"}
              </div>
            </div>
            <div className="bg-white rounded-lg border-2 border-brand-200 p-4">
              <div className="text-sm font-bold text-text-muted mb-2">
                最低スコア
              </div>
              <div className="text-xs text-text-muted mb-2">
                {currentLowestScore?.userName || "データなし"}
              </div>
              <div className="text-3xl font-bold text-brand-600">
                {currentLowestScore
                  ? formatScore({ score: currentLowestScore.value })
                  : "データなし"}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-8">
          <div className="text-2xl font-bold text-text-dark">シーズン一覧</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {leagueSeasons.map((season) => (
              <Link
                key={season.id}
                href={`/league/${league.id}/season/${season.id}`}
                className={`bg-white rounded-lg p-4 hover:shadow-lg transition-shadow relative ${
                  season.status === "active"
                    ? "border-2 border-brand-600"
                    : "border-2 border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-lg font-bold text-text-dark mb-2">
                      {season.name}
                    </div>
                    <div className="text-sm text-text-muted">
                      参加者：{season.memberCount}人
                    </div>
                    <div className="text-sm text-text-muted">
                      対局数：{season.totalMatchCount}局
                    </div>
                  </div>
                  <div
                    className={`flex items-center justify-center w-16 h-12 rounded-lg font-bold text-base ${
                      season.status === "active"
                        ? "bg-brand-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {season.status === "active" ? "進行中" : "終了"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaguePage;
