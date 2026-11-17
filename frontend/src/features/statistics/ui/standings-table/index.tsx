import * as React from "react";

import Link from "next/link";

import { buildStatisticsHref } from "@/features/statistics/model/page";

import { Table } from "@/components/ui/table";

import type { toStandingRows } from "@/features/statistics/model/adapter";

type Props = {
  rows: ReturnType<typeof toStandingRows>;
  leagueId: string;
  seasonId: string;
  leagueName: string;
  seasonName: string;
};
export const StandingsTable = ({
  rows,
  leagueId,
  seasonId,
  leagueName,
  seasonName,
}: Props) => (
  <div className="overflow-x-auto">
    <Table plain className="min-w-[320px] text-center text-[11px]">
      <caption className="sr-only">順位表</caption>
      <thead className="bg-app-brand-soft text-app-text-secondary">
        <tr>
          {[
            "順位",
            "プレイヤー",
            "総合pt",
            "1位",
            "2位",
            "3位",
            "4位",
            "対局数",
          ].map((label) => (
            <th scope="col" className="whitespace-nowrap px-1 py-3" key={label}>
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length ? (
          rows.map((row) => (
            <tr key={row.userId} className="border-b border-app-border-subtle">
              <td className="px-1 py-3 font-semibold">{row.rank}</td>
              <td className="px-1 py-3">
                <Link
                  className="font-semibold text-app-brand-strong"
                  href={buildStatisticsHref({
                    scope: {
                      scopeType: "season",
                      leagueId,
                      seasonId,
                      gameType: "all",
                    },
                    targetUserId: String(row.userId),
                    scopeLabel: `${leagueName} / ${seasonName}`,
                    returnTo: `/league/${leagueId}/season/${seasonId}`,
                  })}
                >
                  {row.userName}
                </Link>
              </td>
              <td className="px-1 py-3 font-semibold tabular-nums">
                {row.totalPoints > 0 ? "+" : ""}
                {row.totalPoints.toFixed(1)}
              </td>
              {[
                row.firstCount,
                row.secondCount,
                row.thirdCount,
                row.fourthCount ?? "—",
                row.matchCount,
              ].map((value, index) => (
                <td key={index} className="px-1 py-3">
                  {value}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={8} className="py-4 text-app-text-secondary">
              まだ対局結果が登録されていません
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  </div>
);
