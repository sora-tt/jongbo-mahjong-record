"use client";

import * as React from "react";

import {
  validateFixedUmaDraft,
  validateFloatingCountUmaDraft,
  type FixedUmaDraft,
  type FloatingCount,
  type FloatingCountUmaDraft,
  type UmaRank,
} from "@/features/league/model/validation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type GameType = "sanma" | "yonma";
type UmaMode = "fixed" | "floatingCount";

type Props = {
  gameType: GameType;
  mode: UmaMode;
  fixedUma: FixedUmaDraft;
  floatingCountUma: FloatingCountUmaDraft;
  showErrorSummary?: boolean;
  submitError?: string | null;
  errorSummaryFocusToken?: number;
  disabled?: boolean;
  onModeChange: (mode: UmaMode) => void;
  onFixedUmaChange: (rank: UmaRank, value: string) => void;
  onFloatingCountUmaChange: (
    floatingCount: FloatingCount,
    rank: UmaRank,
    value: string
  ) => void;
};

const FLOATING_COUNTS = [0, 1, 2, 3, 4] as const;
const RANKS: readonly { key: UmaRank; label: string }[] = [
  { key: "first", label: "1位" },
  { key: "second", label: "2位" },
  { key: "third", label: "3位" },
  { key: "fourth", label: "4位" },
];

const getInputId = (mode: UmaMode, rank: UmaRank, floatingCount?: number) =>
  mode === "fixed"
    ? `fixed-uma-${rank}`
    : `floating-count-${floatingCount}-${rank}`;

type SummaryItem = { href?: string; key: string; message: string };

const LeagueRuleEditor: React.FC<Props> = ({
  gameType,
  mode,
  fixedUma,
  floatingCountUma,
  showErrorSummary = false,
  submitError = null,
  errorSummaryFocusToken = 0,
  disabled = false,
  onModeChange,
  onFixedUmaChange,
  onFloatingCountUmaChange,
}) => {
  const isSanma = gameType === "sanma";
  const activeMode: UmaMode = isSanma ? "fixed" : mode;
  const visibleRanks = isSanma ? RANKS.slice(0, 3) : RANKS;
  const fixedErrors = validateFixedUmaDraft(gameType, fixedUma);
  const floatingErrors = validateFloatingCountUmaDraft(floatingCountUma);
  const summaryRef = React.useRef<HTMLDivElement>(null);

  const summaryItems = React.useMemo(() => {
    if (!showErrorSummary) {
      return [];
    }

    const items: SummaryItem[] = submitError
      ? [{ key: "submit-error", message: submitError }]
      : [];

    if (activeMode === "fixed") {
      Object.entries(fixedErrors.fields ?? {}).forEach(([rank, message]) => {
        const rankKey = rank as UmaRank;
        const rankLabel =
          visibleRanks.find((candidate) => candidate.key === rankKey)?.label ??
          "順位";
        items.push({
          href: `#${getInputId("fixed", rankKey)}`,
          key: rankKey,
          message: `固定順位点の${rankLabel}: ${message}`,
        });
      });
      if (fixedErrors.total) {
        items.push({
          href: `#${getInputId("fixed", visibleRanks[0]?.key ?? "first")}`,
          key: "fixed-total",
          message: fixedErrors.total.message,
        });
      }
      return items;
    }

    FLOATING_COUNTS.forEach((floatingCount) => {
      const errors = floatingErrors[floatingCount];
      if (!errors) {
        return;
      }

      Object.entries(errors.fields ?? {}).forEach(([rank, message]) => {
        const rankKey = rank as UmaRank;
        const rankLabel =
          RANKS.find((candidate) => candidate.key === rankKey)?.label ?? "順位";
        items.push({
          href: `#${getInputId("floatingCount", rankKey, floatingCount)}`,
          key: `${floatingCount}-${rankKey}`,
          message: `${floatingCount}人浮きの${rankLabel}: ${message}`,
        });
      });
      if (errors.total) {
        items.push({
          href: `#${getInputId("floatingCount", "first", floatingCount)}`,
          key: `${floatingCount}-total`,
          message: errors.total.message,
        });
      }
    });

    return items;
  }, [
    activeMode,
    fixedErrors,
    floatingErrors,
    showErrorSummary,
    submitError,
    visibleRanks,
  ]);

  React.useEffect(() => {
    if (summaryItems.length > 0) {
      summaryRef.current?.focus();
    }
  }, [errorSummaryFocusToken, summaryItems.length]);

  return (
    <div className="min-w-0 space-y-2">
      {!isSanma ? (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">方式</h4>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="selection"
              size="sm"
              selected={mode === "fixed"}
              disabled={disabled}
              onClick={() => onModeChange("fixed")}
            >
              固定順位点
            </Button>
            <Button
              type="button"
              variant="selection"
              size="sm"
              selected={mode === "floatingCount"}
              disabled={disabled}
              onClick={() => onModeChange("floatingCount")}
            >
              浮き人数別順位点
            </Button>
          </div>
        </div>
      ) : null}

      {summaryItems.length > 0 ? (
        <div
          ref={summaryRef}
          className="rounded-lg border border-danger bg-white px-2.5 py-2 text-xs text-foreground"
          role="alert"
          aria-labelledby="uma-rule-error-title"
          tabIndex={-1}
        >
          <h5 id="uma-rule-error-title" className="font-semibold text-danger">
            順位点を確認してください
          </h5>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {summaryItems.map((item) => (
              <li key={item.key}>
                {item.href ? (
                  <a className="underline underline-offset-2" href={item.href}>
                    {item.message}
                  </a>
                ) : (
                  item.message
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {activeMode === "fixed" ? (
        <>
          <div className="grid grid-cols-4 gap-2">
            {visibleRanks.map(({ key: rank, label }) => {
              const inputId = getInputId("fixed", rank);
              const fieldError = showErrorSummary
                ? fixedErrors.fields?.[rank]
                : undefined;
              const totalError = showErrorSummary
                ? fixedErrors.total?.message
                : undefined;
              const describedBy = [
                fieldError ? `${inputId}-error` : undefined,
                totalError ? "fixed-uma-total-error" : undefined,
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <Input
                  key={rank}
                  id={inputId}
                  label={label}
                  containerClassName="space-y-1"
                  className="h-10 rounded-lg px-2 text-center shadow-none"
                  type="number"
                  value={fixedUma[rank]}
                  disabled={disabled}
                  aria-invalid={totalError ? true : undefined}
                  aria-describedby={describedBy || undefined}
                  error={fieldError}
                  placeholder="例: 15"
                  onChange={(event) =>
                    onFixedUmaChange(rank, event.target.value)
                  }
                />
              );
            })}
          </div>
          {showErrorSummary && fixedErrors.total ? (
            <p
              id="fixed-uma-total-error"
              className="text-xs text-danger"
              role="alert"
            >
              {fixedErrors.total.message}
            </p>
          ) : null}
        </>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-text-muted">
            返し点を超えている人数ごとの順位点を設定します。
          </p>
          <div className="min-w-0">
            <table className="w-full table-fixed">
              <caption className="sr-only">浮き人数ごとの順位点</caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="w-11 pb-1 text-left text-xs font-semibold text-foreground"
                  >
                    浮き
                  </th>
                  {RANKS.map(({ key, label }) => (
                    <th
                      key={key}
                      id={`floating-count-column-${key}`}
                      scope="col"
                      className="pb-1 text-center text-xs font-semibold text-foreground"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FLOATING_COUNTS.map((floatingCount) => {
                  const rowErrors = floatingErrors[floatingCount];
                  const totalError = showErrorSummary
                    ? rowErrors?.total?.message
                    : undefined;

                  return (
                    <React.Fragment key={floatingCount}>
                      <tr>
                        <th
                          id={`floating-count-heading-${floatingCount}`}
                          scope="row"
                          className="py-1 text-left text-xs font-medium text-foreground"
                        >
                          {floatingCount}人
                        </th>
                        {RANKS.map(({ key: rank, label }) => {
                          const inputId = getInputId(
                            "floatingCount",
                            rank,
                            floatingCount
                          );
                          const fieldError = showErrorSummary
                            ? rowErrors?.fields?.[rank]
                            : undefined;
                          const describedBy = [
                            fieldError ? `${inputId}-error` : undefined,
                            totalError
                              ? `floating-count-${floatingCount}-total-error`
                              : undefined,
                          ]
                            .filter(Boolean)
                            .join(" ");

                          return (
                            <td key={rank} className="px-0.5 py-1">
                              <Input
                                id={inputId}
                                containerClassName="space-y-0"
                                className="h-9 rounded-lg px-1 text-center shadow-none"
                                type="number"
                                value={floatingCountUma[floatingCount][rank]}
                                disabled={disabled}
                                aria-label={`${floatingCount}人浮きの${label}`}
                                aria-invalid={
                                  fieldError || totalError ? true : undefined
                                }
                                aria-describedby={describedBy || undefined}
                                error={fieldError}
                                onChange={(event) =>
                                  onFloatingCountUmaChange(
                                    floatingCount,
                                    rank,
                                    event.target.value
                                  )
                                }
                              />
                            </td>
                          );
                        })}
                      </tr>
                      {totalError ? (
                        <tr>
                          <td colSpan={5} className="pb-1">
                            <p
                              id={`floating-count-${floatingCount}-total-error`}
                              className="text-xs text-danger"
                            >
                              {totalError}
                            </p>
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export { LeagueRuleEditor };
