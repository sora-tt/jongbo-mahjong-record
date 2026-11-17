import * as React from "react";

import {
  formatStatisticsOverviewNumber,
  formatStatisticsOverviewRate,
  getStatisticsOverviewModel,
  getStatisticsOverviewRateBarWidth,
  getVisibleStatisticsRanks,
} from "@/features/statistics/model/overview";
import {
  formatStatisticsFinalPointValue,
  formatStatisticsScoreValue,
  getStatisticsStreak,
} from "@/features/statistics/model/score-records";
import {
  RecordDialog,
  type SelectedRecord,
} from "@/features/statistics/ui/record-dialog";
import { YakumanDialog } from "@/features/statistics/ui/yakuman-dialog";

import { Panel } from "@/components/ui/panel";

import type { PersonalStatisticsSummaryResponse } from "@/features/statistics/api";

type Summary = Exclude<
  PersonalStatisticsSummaryResponse,
  { status: "uncomputed" }
>;
type RecordValue = NonNullable<Summary["records"]["highestRawScore"]>;

const signedColor = (value: number) =>
  value > 0 ? "text-blue-600" : value < 0 ? "text-app-danger" : "text-app-text";

const RecordRow = ({
  label,
  record,
  unit,
  onSelect,
}: {
  label: string;
  record: RecordValue | null;
  unit: "点" | "pt";
  onSelect: (record: SelectedRecord) => void;
}) => {
  if (!record) {
    return (
      <div className="flex justify-between gap-3 py-3">
        <span className="text-app-text-secondary">{label}</span>
        <span>—</span>
      </div>
    );
  }
  const value =
    unit === "pt"
      ? formatStatisticsFinalPointValue(record.value)
      : formatStatisticsScoreValue(record.value);
  return (
    <button
      type="button"
      className="flex min-h-11 w-full cursor-pointer justify-between gap-3 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-focus"
      onClick={() => onSelect({ label, unit, record })}
    >
      <span className="text-app-text-secondary">{label}</span>
      <span className="font-semibold">
        {value} {unit} <span aria-hidden="true">›</span>
      </span>
    </button>
  );
};

export const StatisticsOverview = ({
  summary,
  overall = false,
}: {
  summary: Summary;
  startingPoints: number | null;
  startingPointsByLeagueId: Readonly<Record<string, number>>;
  overall?: boolean;
}) => {
  const overview = getStatisticsOverviewModel(summary);
  const breakdown = summary.pointBreakdown;
  const records = summary.records;
  const [selectedRecord, setSelectedRecord] =
    React.useState<SelectedRecord | null>(null);
  const [yakumanOpen, setYakumanOpen] = React.useState(false);
  React.useEffect(() => {
    setSelectedRecord(null);
    setYakumanOpen(false);
  }, [summary]);
  const yakumanCounts = summary.yakumanCounts;
  const yakumanTotal = yakumanCounts?.reduce(
    (sum, item) => sum + item.count,
    0
  );
  const streaks = [
    ["top", "連続トップ"],
    ["last", "連続ラス"],
    ["topTwo", "連続連対"],
    ["positive", "連続プラス"],
    ["negative", "連続マイナス"],
  ] as const;
  return (
    <section aria-label="成績の概要" className="space-y-4">
      {!overall && (
        <Panel>
          <h2 className="text-app-label font-bold">総合ポイント</h2>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <p
              className={`text-3xl font-bold ${signedColor(summary.totals.totalPoints)}`}
            >
              {formatStatisticsFinalPointValue(summary.totals.totalPoints)}{" "}
              <span className="text-app-label">pt</span>
            </p>
            <p className="text-app-caption text-app-text-secondary">
              {summary.totals.totalMatchCount}対局
            </p>
          </div>
          <dl className="mt-4 space-y-2 border-t border-app-border-subtle pt-3 text-app-caption">
            {(
              [
                ["素点由来", breakdown?.rawPoint],
                ["順位点・オカ", breakdown?.rankPoint],
                ["チョンボ罰点", breakdown?.chomboPenalty],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-app-text-secondary">{label}</dt>
                <dd className="font-semibold">
                  {value == null
                    ? "—"
                    : `${formatStatisticsFinalPointValue(value)} pt`}
                </dd>
              </div>
            ))}
          </dl>
          {!breakdown && (
            <p className="mt-2 text-app-caption text-app-text-secondary">
              内訳を取得できませんでした。
            </p>
          )}
        </Panel>
      )}
      {overview.formatDetails.map((format) => (
        <Panel key={format.gameType}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-app-heading-2 font-bold">
              順位成績
              {overview.formatDetails.length > 1
                ? `（${format.gameType === "sanma" ? "三麻" : "四麻"}）`
                : ""}
            </h2>
            {overall && (
              <span className="text-app-caption text-app-text-secondary">
                {format.matchCount} 対局
              </span>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
            {(
              [
                [
                  "平均順位",
                  format.averageRank === null
                    ? "—"
                    : `${formatStatisticsOverviewNumber(format.averageRank)} 位`,
                ],
                ["トップ率", formatStatisticsOverviewRate(format.topRate)],
                ["連対率", formatStatisticsOverviewRate(format.topTwoRate)],
                [
                  "ラス回避率",
                  formatStatisticsOverviewRate(format.lastAvoidanceRate),
                ],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <p className="text-app-caption text-app-text-secondary">
                  {label}
                </p>
                <p className="mt-1 text-app-data font-bold">{value}</p>
              </div>
            ))}
          </div>
          <ul
            className="mt-4 space-y-3 border-t border-app-border-subtle pt-4"
            aria-label="順位別の回数と割合"
          >
            {getVisibleStatisticsRanks(format.gameType, format.ranks).map(
              (rank) => (
                <li
                  key={rank.rank}
                  className="grid grid-cols-[28px_1fr_auto_48px] items-center gap-2 text-app-caption"
                >
                  <span>{rank.rank}位</span>
                  <span className="h-2 overflow-hidden rounded-full bg-app-brand-soft">
                    <span
                      className="block h-full rounded-full bg-app-action-primary"
                      style={{
                        width:
                          getStatisticsOverviewRateBarWidth(rank.rate) ?? "0%",
                      }}
                    />
                  </span>
                  <span className="text-app-text-secondary">
                    {rank.count}回
                  </span>
                  <span className="text-right font-semibold">
                    {formatStatisticsOverviewRate(rank.rate)}
                  </span>
                </li>
              )
            )}
          </ul>
        </Panel>
      ))}
      <Panel>
        <h2 className="text-app-heading-2 font-bold">個人記録</h2>
        <div className="mt-2 divide-y divide-app-border-subtle text-app-label">
          {!overall && (
            <>
              <RecordRow
                label="最高素点"
                record={records.highestRawScore}
                unit="点"
                onSelect={setSelectedRecord}
              />
              <RecordRow
                label="最低素点"
                record={records.lowestRawScore}
                unit="点"
                onSelect={setSelectedRecord}
              />
              <RecordRow
                label="最高最終ポイント"
                record={records.highestFinalPoint}
                unit="pt"
                onSelect={setSelectedRecord}
              />
              <RecordRow
                label="最低最終ポイント"
                record={records.lowestFinalPoint}
                unit="pt"
                onSelect={setSelectedRecord}
              />
            </>
          )}
          {yakumanTotal === undefined ? (
            <div className="flex justify-between gap-3 py-3">
              <span className="text-app-text-secondary">役満</span>
              <span>—</span>
            </div>
          ) : (
            <button
              type="button"
              className="flex min-h-11 w-full cursor-pointer justify-between gap-3 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-focus"
              onClick={() => setYakumanOpen(true)}
            >
              <span className="text-app-text-secondary">役満</span>
              <span className="font-semibold">
                {yakumanTotal} 回 <span aria-hidden="true">›</span>
              </span>
            </button>
          )}
          <div className="flex justify-between gap-3 py-3">
            <span className="text-app-text-secondary">チョンボ</span>
            <span className="font-semibold">
              {summary.totals.chomboCount} 回
            </span>
          </div>
        </div>
      </Panel>
      <RecordDialog
        selected={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
      <YakumanDialog
        counts={yakumanCounts ?? []}
        open={yakumanOpen && yakumanCounts != null}
        onClose={() => setYakumanOpen(false)}
      />
      <Panel>
        <h2 className="text-app-heading-2 font-bold">連続記録</h2>
        <table className="mt-3 w-full text-left text-app-caption">
          <thead className="text-app-text-secondary">
            <tr>
              <th className="py-2">記録</th>
              <th className="py-2 text-right">現在</th>
              <th className="py-2 text-right">最長</th>
            </tr>
          </thead>
          <tbody>
            {streaks
              .filter(
                ([type]) =>
                  !overall || (type !== "positive" && type !== "negative")
              )
              .map(([type, label]) => {
                const streak = getStatisticsStreak(summary.streaks, type);
                return (
                  <tr key={type} className="border-t border-app-border-subtle">
                    <th scope="row" className="py-3 font-normal">
                      {label}
                    </th>
                    <td className="text-right">
                      {streak ? `${streak.currentCount}対局` : "—"}
                    </td>
                    <td className="text-right">
                      {streak ? `${streak.longestCount}対局` : "—"}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </Panel>
    </section>
  );
};
