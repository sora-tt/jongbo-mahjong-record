import * as React from "react";

import { ChevronRight, Crown, X } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "@/features/statistics/ui/v2/statistics-table";

import { Dialog } from "@/components/v2/ui/dialog";
import { EmptyState } from "@/components/v2/ui/empty-state";
import { IconButton } from "@/components/v2/ui/icon-button";
import { SectionCard } from "@/components/v2/ui/section-card";

import type { useSeasonPage } from "@/features/season/hooks/use-season-page";

type Season = NonNullable<ReturnType<typeof useSeasonPage>["season"]>;
type RankingKey = keyof Season["titleRankings"];
const metrics: { key: RankingKey; label: string; unit: "点" | "%" | "回" }[] = [
  { key: "highestScore", label: "最高スコア", unit: "点" },
  { key: "avoidLastRate", label: "ラス回避率", unit: "%" },
  { key: "top2Rate", label: "連対率", unit: "%" },
  { key: "yakuman", label: "最多役満", unit: "回" },
];

const formatValue = (value: number, unit: "点" | "%" | "回") =>
  unit === "%"
    ? `${value.toFixed(2)}%`
    : `${value.toLocaleString("ja-JP")}${unit}`;

export const SeasonTitles = ({ season }: { season: Season }) => {
  const [selected, setSelected] = React.useState<
    (typeof metrics)[number] | null
  >(null);
  const ref = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();
  const rankings = season.titleRankings;
  const available = metrics.filter((metric) => rankings[metric.key].length > 0);

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (selected && !dialog.open) dialog.showModal();
    if (!selected && dialog.open) dialog.close();
  }, [selected]);

  return (
    <>
      <SectionCard title="タイトル">
        {available.length ? (
          <div className="divide-y divide-v2-border-subtle">
            {available.map((metric) => {
              const leader = rankings[metric.key][0];
              return (
                <button
                  key={metric.key}
                  type="button"
                  onClick={() => setSelected(metric)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5.5rem_16px] items-center gap-2 px-2 py-3 text-left text-v2-label text-v2-text-secondary"
                  aria-label={`${metric.label}のランキングを表示`}
                >
                  <span>{metric.label}</span>
                  <span className="flex min-w-0 items-center justify-center gap-1">
                    <Crown
                      size={16}
                      className="shrink-0 text-[var(--v2-warning)]"
                      aria-hidden="true"
                    />
                    <span className="truncate font-semibold text-v2-text">
                      {leader.userName}
                    </span>
                  </span>
                  <span className="text-right font-semibold text-v2-text">
                    {formatValue(leader.value, metric.unit)}
                  </span>
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="まだタイトルデータがありません"
            className="!border-0 !bg-transparent p-0"
          />
        )}
      </SectionCard>
      <Dialog
        ref={ref}
        onClose={() => setSelected(null)}
        aria-labelledby={titleId}
        className="w-full"
      >
        {selected && (
          <>
            <header className="flex items-center justify-between gap-3">
              <h2 id={titleId} className="text-v2-heading-2 font-bold">
                {selected.label}ランキング
              </h2>
              <IconButton
                type="button"
                variant="tertiary"
                className="!border-0"
                aria-label="閉じる"
                onClick={() => ref.current?.close()}
              >
                <X size={20} aria-hidden="true" />
              </IconButton>
            </header>
            <div className="mt-4">
              <Table
                caption={`${selected.label}ランキング`}
                className="table-fixed"
              >
                <colgroup>
                  <col className="w-[20%]" />
                  <col className="w-[45%]" />
                  <col className="w-[35%]" />
                </colgroup>
                <TableHead>
                  <TableRow>
                    <TableHeadCell scope="col">順位</TableHeadCell>
                    <TableHeadCell scope="col" className="!text-left">
                      プレイヤー
                    </TableHeadCell>
                    <TableHeadCell scope="col" className="!text-right">
                      記録
                    </TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rankings[selected.key].map((entry) => {
                    const rank =
                      rankings[selected.key].findIndex(
                        (item) => item.value === entry.value
                      ) + 1;
                    return (
                      <TableRow key={entry.userId}>
                        <TableCell className="text-v2-text-secondary">
                          {rank}位
                        </TableCell>
                        <TableCell className="break-words !text-left font-semibold">
                          {entry.userName}
                        </TableCell>
                        <TableCell className="whitespace-nowrap !text-right font-semibold">
                          {formatValue(entry.value, selected.unit)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Dialog>
    </>
  );
};
