import * as React from "react";

import { X } from "lucide-react";

import { YAKUMAN_OPTIONS } from "@/lib/yakuman";

import { Dialog } from "@/components/ui/dialog";
import { IconButton } from "@/components/ui/icon-button";

import type { PersonalStatisticsSummaryResponse } from "@/features/statistics/api";
import type { ApiYakumanKind } from "@/lib/yakuman";

type Summary = Exclude<
  PersonalStatisticsSummaryResponse,
  { status: "uncomputed" }
>;
type Counts = NonNullable<Summary["yakumanCounts"]>;
const variants: Partial<
  Record<ApiYakumanKind, { kind: ApiYakumanKind; description: string }>
> = {
  kokushiMusou: { kind: "kokushi13Wait", description: "十三面待ち" },
  suuankou: { kind: "suuankouTanki", description: "単騎待ち" },
  chuurenPoutou: { kind: "junseiChuurenPoutou", description: "純正" },
};
const variantKinds = new Set(Object.values(variants).map(({ kind }) => kind));

export const YakumanDialog = ({
  counts,
  open,
  onClose,
}: {
  counts: Counts;
  open: boolean;
  onClose: () => void;
}) => {
  const ref = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const countByKind = new Map(counts.map(({ kind, count }) => [kind, count]));
  const total = counts.reduce((sum, item) => sum + item.count, 0);

  return (
    <Dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      className="w-full"
    >
      <header className="flex items-center justify-between gap-3">
        <h2 id={titleId} className="text-app-heading-2 font-bold">
          役満の記録
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
      <p className="mt-3 text-app-label font-bold">合計 {total} 回</p>
      <dl className="mt-2 divide-y divide-app-border-subtle text-app-caption">
        {YAKUMAN_OPTIONS.filter(({ kind }) => !variantKinds.has(kind)).map(
          ({ kind, label }) => {
            const variant = variants[kind];
            const variantCount = variant
              ? (countByKind.get(variant.kind) ?? 0)
              : 0;
            const count = (countByKind.get(kind) ?? 0) + variantCount;
            return (
              <div key={kind} className="flex justify-between gap-3 py-2.5">
                <dt className="text-app-text-secondary">
                  {label}
                  {variant && (
                    <span className="ml-1 text-[10px] text-app-text-secondary">
                      ※括弧内は{variant.description}
                    </span>
                  )}
                </dt>
                <dd className="shrink-0 font-semibold">
                  {count}
                  {variantCount > 0 && `(${variantCount})`} 回
                </dd>
              </div>
            );
          }
        )}
      </dl>
    </Dialog>
  );
};
