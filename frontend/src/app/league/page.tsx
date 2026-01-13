"use client";

import * as React from "react";

import clsx from "clsx";
import { Calendar, BookOpen, Crown } from "lucide-react";

import Button from "@/components/ui/button";
import { HeaderCard } from "@/components/ui/header-card";
import { SectionCard } from "@/components/ui/section-card";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeadCell,
  TableCell,
} from "@/components/ui/table";

import { useLeague } from "./hooks";

import type { ColorState } from "@/types/domain/color";

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
  amber: "bg-amber-500",
  lime: "bg-lime-500",
  teal: "bg-teal-500",
  cyan: "bg-cyan-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  fuchsia: "bg-fuchsia-500",
  rose: "bg-rose-500",
  magenta: "bg-magenta-500",
  brown: "bg-yellow-800",
  stone: "bg-stone-500",
  gray: "bg-gray-500",
  black: "bg-black",
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
        <section className="mb-6">
          <HeaderCard
            title={name}
            align="center"
            metaItems={[
              {
                icon: <Calendar size={14} className="text-white" />,
                label: `${createdAt.format("yyyy/MM/dd")} 〜 ${lastRecordedAt.format(
                  "yyyy/MM/dd"
                )}`,
              },
              {
                icon: <BookOpen size={14} className="text-white" />,
                label: ruleName,
              },
            ]}
          />
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
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeadCell>順位</TableHeadCell>
                  <TableHeadCell>プレイヤー</TableHeadCell>
                  <TableHeadCell>総合pt</TableHeadCell>
                  <TableHeadCell>1位</TableHeadCell>
                  <TableHeadCell>2位</TableHeadCell>
                  <TableHeadCell>3位</TableHeadCell>
                  <TableHeadCell>4位</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((member) => (
                  <TableRow
                    key={member.rank}
                    className="border-t border-pink-200 text-text-muted"
                  >
                    <TableCell>{member.rank}</TableCell>
                    <TableCell>{member.player.name}</TableCell>
                    <TableCell
                      className={clsx(
                        "font-semibold",
                        member.totalPoints >= 0
                          ? "text-blue-400"
                          : "text-red-400"
                      )}
                    >
                      {member.totalPoints.toFixed(1)}
                    </TableCell>
                    <TableCell>{member.numberOfEachOrder.first}</TableCell>
                    <TableCell>{member.numberOfEachOrder.second}</TableCell>
                    <TableCell>{member.numberOfEachOrder.third}</TableCell>
                    <TableCell>{member.numberOfEachOrder.fourth}</TableCell>
                  </TableRow>
                ))}
                {members.length === 0 && (
                  <TableRow className="border-t border-pink-200">
                    <TableCell
                      colSpan={7}
                      className="px-3 py-4 text-center text-gray-400"
                    >
                      まだ対局結果が登録されていません
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </SectionCard>
        </section>

        <section className="mb-8">
          <SectionCard title="総合pt推移" bodyClassName="p-4">
            <div className="w-full h-48 bg-gray-50 rounded-md mb-3" />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {members.map((member, index) => (
                <div key={index} className="flex items-center gap-1">
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
              {titles.map((t) => (
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
              ))}
            </div>
          </SectionCard>
        </section>
      </div>
    </div>
  );
};

export default LeaguePage;
