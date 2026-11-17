import * as React from "react";

import {
  formatStatisticsFinalPointValue,
  formatStatisticsRateCount,
  formatStatisticsScoreValue,
  getVisibleStatisticsScoreFormats,
  getVisibleStatisticsScoreRanks,
} from "@/features/statistics/model/score-records";

import { Panel } from "@/components/ui/panel";

import type { PersonalStatisticsSummaryResponse } from "@/features/statistics/api";

type Summary = Exclude<
  PersonalStatisticsSummaryResponse,
  { status: "uncomputed" }
>;

export const ScoreBreakdown = ({
  summary,
}: {
  summary: Summary;
  startingPoints?: number | null;
}) => {
  const formats = getVisibleStatisticsScoreFormats(summary.scoreByGameType);
  const showGameType = formats.length > 1;
  return (
    <Panel>
      <h2 className="text-app-heading-2 font-bold">スコア分析</h2>
      {formats.map(({ gameType, finalPoint }) => {
        const rows = getVisibleStatisticsScoreRanks(
          gameType,
          summary.scoreByRank
        );
        return (
          <section key={gameType} className="mt-4 space-y-4">
            {showGameType && (
              <h3 className="text-app-label font-bold">
                {gameType === "sanma" ? "三麻" : "四麻"}
              </h3>
            )}
            <div>
              <h3 className="text-app-label font-semibold">プラス・マイナス</h3>
              <table className="mt-2 w-full text-left text-app-caption">
                <thead className="text-app-text-secondary">
                  <tr>
                    <th className="py-2">結果</th>
                    <th className="text-right">回数</th>
                    <th className="text-right">割合</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ["プラス", finalPoint.positive],
                      ["マイナス", finalPoint.negative],
                      ["同点", finalPoint.even],
                    ] as const
                  ).map(([label, data]) => {
                    const value = formatStatisticsRateCount(data);
                    return (
                      <tr
                        key={label}
                        className="border-t border-app-border-subtle"
                      >
                        <th scope="row" className="py-2 font-normal">
                          {label}
                        </th>
                        <td className="text-right">{value.count}</td>
                        <td className="text-right">
                          {data.rate === null ? "—" : value.rate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="text-app-label font-semibold">順位別スコア</h3>
              <div className="overflow-x-auto">
                <table className="mt-2 w-full min-w-[300px] text-left text-app-caption">
                  <thead className="text-app-text-secondary">
                    <tr>
                      <th className="py-2">順位</th>
                      <th className="text-right">対局</th>
                      <th className="text-right">平均素点</th>
                      <th className="text-right">平均pt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.rank}
                        className="border-t border-app-border-subtle"
                      >
                        <th scope="row" className="py-3 font-normal">
                          {row.rank}位
                        </th>
                        <td className="text-right">{row.matchCount}回</td>
                        <td className="text-right">
                          {row.averageRawScore === null
                            ? "—"
                            : `${formatStatisticsScoreValue(row.averageRawScore)} 点`}
                        </td>
                        <td className="text-right">
                          {row.averageFinalPoint === null
                            ? "—"
                            : formatStatisticsFinalPointValue(
                                row.averageFinalPoint
                              )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        );
      })}
    </Panel>
  );
};
