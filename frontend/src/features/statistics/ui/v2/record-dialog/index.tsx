import * as React from "react";

import { X } from "lucide-react";

import {
  formatStatisticsFinalPointValue,
  formatStatisticsRecordDate,
  formatStatisticsScoreValue,
} from "@/features/statistics/model/score-records";

import { ButtonLink } from "@/components/v2/ui/button-link";
import { Dialog } from "@/components/v2/ui/dialog";
import { IconButton } from "@/components/v2/ui/icon-button";

import type { PersonalStatisticsSummaryResponse } from "@/features/statistics/api";

type Summary = Exclude<
  PersonalStatisticsSummaryResponse,
  { status: "uncomputed" }
>;
export type SelectedRecord = {
  label: string;
  unit: "点" | "pt";
  record: NonNullable<Summary["records"]["highestRawScore"]>;
};

export const RecordDialog = ({
  selected,
  onClose,
}: {
  selected: SelectedRecord | null;
  onClose: () => void;
}) => {
  const ref = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (selected && !dialog.open) dialog.showModal();
    if (!selected && dialog.open) dialog.close();
  }, [selected]);

  const match = selected?.record.match;
  const value =
    selected &&
    (selected.unit === "pt"
      ? formatStatisticsFinalPointValue(selected.record.value)
      : formatStatisticsScoreValue(selected.record.value));
  const opponents =
    match?.opponents
      .map(
        (opponent) =>
          `${opponent.userName || "名前未設定"}（${opponent.rank}位）`
      )
      .join("、") || "情報なし";

  return (
    <Dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      className="w-full"
    >
      {selected && match && (
        <>
          <header className="flex items-center justify-between gap-3">
            <h2 id={titleId} className="text-v2-heading-2 font-bold">
              個人記録
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
          <div className="mt-4 rounded-v2-control bg-v2-surface-subtle p-4">
            <p className="text-v2-caption text-v2-text-secondary">
              {selected.label}
            </p>
            <p className="mt-1 text-3xl font-bold">
              {value}{" "}
              <span className="text-v2-label font-semibold text-v2-text-secondary">
                {selected.unit}
              </span>
            </p>
          </div>
          <h3 className="mt-6 text-v2-label font-bold">対局情報</h3>
          <dl className="mt-2 divide-y divide-v2-border-subtle text-v2-caption">
            {(
              [
                [
                  "対局日時",
                  `${formatStatisticsRecordDate(match.playedAt)}（日本時間）`,
                ],
                ["リーグ", match.leagueName],
                ["シーズン", match.seasonName],
                ["セッション", match.sessionLabel ?? "名称なし"],
                ["同卓者", opponents],
              ] as const
            ).map(([label, text]) => (
              <div
                key={label}
                className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3 py-2.5"
              >
                <dt className="text-v2-text-secondary">{label}</dt>
                <dd className="break-words font-semibold">{text}</dd>
              </div>
            ))}
          </dl>
          <ButtonLink
            href={`/v2/league/${match.leagueId}/season/${match.seasonId}/sessions/${match.sessionId}/results`}
            fullWidth
            className="mt-6"
          >
            対局結果を見る
          </ButtonLink>
        </>
      )}
    </Dialog>
  );
};
