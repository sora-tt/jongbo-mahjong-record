"use client";

import * as React from "react";

import Header from "@/components/common/container/header";

import { useLeague } from "./hooks";

const LeaguePage: React.FC = () => {
  const { winStreak, loseStreak, highestScore, lowestScore, seasons } =
    useLeague();

  return (
    <div className="flex-1 bg-white min-h-screen font-jp">
      <Header />
      <div className="flex flex-col max-w-7xl gap-4 mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 画面上部：リーグ全シーズンの記録 */}
        <div className="flex flex-col gap-4">
          <div className="text-2xl font-bold text-text-dark">リーグ記録</div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {/* 連勝記録 */}
            <div className="bg-white rounded-lg border-2 border-brand-200 p-4">
              <div className="text-sm font-bold text-text-muted mb-2">
                連勝記録
              </div>
              <div className="text-xs text-text-muted mb-2">
                {winStreak.player}
              </div>
              <div className="text-3xl font-bold text-brand-600">
                {winStreak.text}
              </div>
            </div>
            {/* 連敗記録 */}
            <div className="bg-white rounded-lg border-2 border-brand-200 p-4">
              <div className="text-sm font-bold text-text-muted mb-2">
                連敗記録
              </div>
              <div className="text-xs text-text-muted mb-2">
                {loseStreak.player}
              </div>
              <div className="text-3xl font-bold text-brand-600">
                {loseStreak.text}
              </div>
            </div>
            {/* 最高スコア */}
            <div className="bg-white rounded-lg border-2 border-brand-200 p-4">
              <div className="text-sm font-bold text-text-muted mb-2">
                最高スコア
              </div>
              <div className="text-xs text-text-muted mb-2">
                {highestScore.player}
              </div>
              <div className="text-3xl font-bold text-brand-600">
                {highestScore.text}
              </div>
            </div>
            {/* 最低スコア */}
            <div className="bg-white rounded-lg border-2 border-brand-200 p-4">
              <div className="text-sm font-bold text-text-muted mb-2">
                最低スコア
              </div>
              <div className="text-xs text-text-muted mb-2">
                {lowestScore.player}
              </div>
              <div className="text-3xl font-bold text-brand-600">
                {lowestScore.text}
              </div>
            </div>
          </div>
        </div>

        {/* 画面下部：シーズン一覧 */}
        <div className="flex flex-col gap-4 mt-8">
          <div className="text-2xl font-bold text-text-dark">シーズン一覧</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {seasons.map((season) => (
              <div
                key={season.leagueSeasonId}
                className={`bg-white rounded-lg p-4 hover:shadow-lg transition-shadow relative ${
                  season.isOngoing
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
                      対局数：{season.gameCount}局
                    </div>
                  </div>
                  <div
                    className={`flex items-center justify-center w-16 h-12 rounded-lg font-bold text-base ${
                      season.isOngoing
                        ? "bg-brand-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {season.isOngoing ? "進行中" : "終了"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaguePage;
