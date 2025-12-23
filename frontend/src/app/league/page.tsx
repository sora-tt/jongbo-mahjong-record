// app/league/page.tsx
"use client";

import * as React from "react";

import clsx from "clsx";
import { Calendar, BookOpen, Crown } from "lucide-react";

import LeagueSectionCard from "@/components/league-section-card/index";

import { useLeague } from "./hooks";

import { ColorState } from "@/types/domain/color";

const COLOR_MAP: Record<ColorState, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  orange: "bg-orange-500",
  sky: "bg-sky-500",
  emerald: "bg-emerald-500",
};

export const LeaguePage: React.FC = () => {
  const { league, error } = useLeague();

  if (error) {
    return (
      <div className="flex-1 bg-white min-h-full font-jp">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!league) return null;

  const {
    name,
    createdAt,
    lastRecordedAt,
    ruleName,
    totalGames,
    members,
    titles,
  } = league;

  return (
    <div className="flex-1 bg-white min-h-full font-jp">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <section className="mb-6">
          <div className="rounded-lg border border-brand-500 bg-gradient-to-r from-brand-500 to-brand-400 shadow-sm px-4 py-4 text-center">
            <h1 className="text-2xl font-bold text-white mb-2">{name}</h1>
            <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-xs text-white">
              <span className="inline-flex items-center gap-1">
                <Calendar size={14} className="text-white" />
                <span>
                  {createdAt.toLocaleDateString()} 〜{" "}
                  {lastRecordedAt.toLocaleDateString()}
                </span>
              </span>
              <span className="inline-flex items-center gap-1">
                <BookOpen size={14} className="text-white" />
                <span>{ruleName}</span>
              </span>
            </div>
          </div>
        </section>

        {/* 記録ボタン */}
        <section className="mb-6">
          <div className="flex gap-3">
            <button
              className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors duration-150"
              // TODO: onClickを設定
            >
              更新する
            </button>
            <button
              className="flex-1 px-4 py-2 border-2 border-brand-500 text-brand-600 font-medium rounded-lg hover:bg-brand-50 transition-colors duration-150"
              // TODO: onClickを設定
            >
              記録する
            </button>
          </div>
        </section>

        {/* 順位表 */}
        <section className="mb-8">
          <LeagueSectionCard
            title="順位表"
            rightText={`総対局数：${totalGames}`}
            bodyClassName="p-4 overflow-x-auto"
          >
            {/* TODO:tableのコンポーネント化 */}
            <table className="min-w-full text-xs">
              <thead className="bg-brand-50">
                <tr>
                  <th className="px-2 py-2 text-center font-semibold text-text-muted whitespace-nowrap">
                    順位
                  </th>
                  <th className="px-2 py-2 text-center font-semibold text-text-muted whitespace-nowrap">
                    プレイヤー
                  </th>
                  <th className="px-2 py-2 text-center font-semibold text-text-muted whitespace-nowrap">
                    総合pt
                  </th>
                  <th className="px-2 py-2 text-center font-semibold text-text-muted whitespace-nowrap">
                    1位
                  </th>
                  <th className="px-2 py-2 text-center font-semibold text-text-muted whitespace-nowrap">
                    2位
                  </th>
                  <th className="px-2 py-2 text-center font-semibold text-text-muted whitespace-nowrap">
                    3位
                  </th>
                  <th className="px-2 py-2 text-center font-semibold text-text-muted whitespace-nowrap">
                    4位
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr
                    key={member.rank}
                    className="border-t border-pink-200 text-text-muted"
                  >
                    <td className="px-2 py-2 text-center">{member.rank}</td>
                    <td className="px-2 py-2 text-center">
                      {member.player.name}
                    </td>
                    <td
                      className={`px-2 py-2 text-center font-semibold ${
                        member.totalPoints >= 0
                          ? "text-blue-400"
                          : "text-red-400"
                      }`}
                    >
                      {member.totalPoints.toFixed(1)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {member.numberOfEachOrder.first}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {member.numberOfEachOrder.second}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {member.numberOfEachOrder.third}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {member.numberOfEachOrder.fourth}
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr className="border-t border-pink-200">
                    <td
                      className="px-3 py-4 text-center text-gray-400"
                      colSpan={7}
                    >
                      まだ対局結果が登録されていません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </LeagueSectionCard>
        </section>

        {/* 総合pt推移 */}
        <section className="mb-8">
          <LeagueSectionCard title="総合pt推移" bodyClassName="p-4">
            <div className="w-full h-48 bg-gray-50 rounded-md mb-3" />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {members.map((member, index) => (
                <div key={index} className="flex items-center gap-1">
                  <span
                    className={clsx([
                      "inline-block w-2 h-2 rounded-full",
                      COLOR_MAP[member.player.color] ?? "bg-gray-500",
                    ])}
                    // className={`inline-block w-2 h-2 rounded-full bg-${member.player.color}-500`}
                  />
                  <span className="text-text-muted">{member.player.name}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-text-muted">
              ※プレイヤー名をタップするとデータを非表示にできます
            </p>
          </LeagueSectionCard>
        </section>

        {/* タイトル */}
        <section className="mb-8">
          <LeagueSectionCard title="タイトル" bodyClassName="p-4">
            <div>
              {titles.map((t) => (
                <div
                  key={t.label}
                  className="grid grid-cols-3 gap-x-4 px-4 py-2 text-sm border-b border-pink-200 last:border-b-0 items-center text-text-muted"
                >
                  {/* 左：タイトル名（左寄せ） */}
                  <div className="text-left">{t.label}</div>

                  {/* 中央：冠アイコン＋プレイヤー名（中央寄せ） */}
                  <div className="flex items-center justify-center gap-1">
                    <Crown size={16} className="text-yellow-400" />
                    <span className="font-semibold">{t.playerName}</span>
                  </div>

                  {/* 右：値（右寄せ） */}
                  <div className="text-right">
                    <span className="font-semibold">{t.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </LeagueSectionCard>
        </section>
      </div>
    </div>
  );
};

export default LeaguePage;
