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

const inputClassName =
  "min-h-11 w-full min-w-0 rounded-control border border-border bg-white px-3 py-2 text-base text-foreground shadow-sm transition-colors focus:border-brand-strong focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60 aria-invalid:border-danger";

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
  const shouldFocusSummaryRef = React.useRef(false);

  const summaryItems = React.useMemo(() => {
    const submitErrors =
      showErrorSummary && submitError
        ? ([{ key: "submit-error", message: submitError }] as SummaryItem[])
        : [];

    if (!showErrorSummary) {
      return [];
    }

    if (activeMode === "fixed") {
      const fields: SummaryItem[] = Object.entries(
        fixedErrors.fields ?? {}
      ).map(([rank, message]) => {
        const rankKey = rank as UmaRank;
        const rankLabel =
          visibleRanks.find((candidate) => candidate.key === rankKey)?.label ??
          "順位";
        return {
          href: `#${getInputId("fixed", rankKey)}`,
          key: rankKey,
          message: `固定順位点の${rankLabel}: ${message}`,
        };
      });
      if (fixedErrors.total) {
        fields.push({
          href: `#${getInputId("fixed", visibleRanks[0]?.key ?? "first")}`,
          key: "fixed-total",
          message: fixedErrors.total.message,
        });
      }
      return [...submitErrors, ...fields];
    }

    const fields = FLOATING_COUNTS.flatMap((floatingCount) => {
      const errors = floatingErrors[floatingCount];
      if (!errors) {
        return [];
      }

      const rowFields = Object.entries(errors.fields ?? {}).map(
        ([rank, message]) => {
          const rankKey = rank as UmaRank;
          const rankLabel =
            RANKS.find((candidate) => candidate.key === rankKey)?.label ??
            "順位";
          return {
            href: `#${getInputId("floatingCount", rankKey, floatingCount)}`,
            key: `${floatingCount}-${rankKey}`,
            message: `${floatingCount}人浮きの${rankLabel}: ${message}`,
          };
        }
      );
      if (errors.total) {
        rowFields.push({
          href: `#${getInputId("floatingCount", "first", floatingCount)}`,
          key: `${floatingCount}-total`,
          message: errors.total.message,
        });
      }
      return rowFields;
    });
    return [...submitErrors, ...fields];
  }, [
    activeMode,
    fixedErrors,
    floatingErrors,
    showErrorSummary,
    submitError,
    visibleRanks,
  ]);

  shouldFocusSummaryRef.current = showErrorSummary && summaryItems.length > 0;

  React.useEffect(() => {
    if (shouldFocusSummaryRef.current) {
      summaryRef.current?.focus();
    }
  }, [errorSummaryFocusToken]);

  return (
    <section className="min-w-0 space-y-4" aria-labelledby="uma-rule-title">
      <h3 id="uma-rule-title" className="font-semibold text-foreground">
        順位点設定
      </h3>

      {summaryItems.length > 0 ? (
        <div
          ref={summaryRef}
          className="rounded-control border border-danger bg-danger/5 p-4 text-foreground"
          role="alert"
          aria-labelledby="uma-rule-error-title"
          tabIndex={-1}
        >
          <h4 id="uma-rule-error-title" className="font-semibold text-danger">
            順位点を確認してください
          </h4>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {summaryItems.map((item) => (
              <li key={item.key}>
                {item.href ? (
                  <a
                    className="underline underline-offset-2 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    href={item.href}
                  >
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

      {!isSanma ? (
        <fieldset className="space-y-2" disabled={disabled}>
          <legend className="text-sm font-medium text-foreground">
            順位点の方式
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control border border-border px-3 py-2 text-base text-foreground focus-within:border-brand-strong">
              <input
                type="radio"
                name="league-uma-mode"
                value="fixed"
                checked={mode === "fixed"}
                onChange={() => onModeChange("fixed")}
                className="size-4 accent-brand-strong"
              />
              固定順位点
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control border border-border px-3 py-2 text-base text-foreground focus-within:border-brand-strong">
              <input
                type="radio"
                name="league-uma-mode"
                value="floatingCount"
                checked={mode === "floatingCount"}
                onChange={() => onModeChange("floatingCount")}
                className="size-4 accent-brand-strong"
              />
              浮き人数別順位点
            </label>
          </div>
        </fieldset>
      ) : null}

      {activeMode === "fixed" ? (
        <div className="min-w-0 space-y-3">
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
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
                <div key={rank} className="min-w-0 space-y-1.5">
                  <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-foreground"
                  >
                    {label}ウマ
                  </label>
                  <input
                    id={inputId}
                    type="number"
                    step="1"
                    inputMode="numeric"
                    value={fixedUma[rank]}
                    disabled={disabled}
                    aria-invalid={fieldError || totalError ? true : undefined}
                    aria-describedby={describedBy || undefined}
                    className={inputClassName}
                    onChange={(event) =>
                      onFixedUmaChange(rank, event.currentTarget.value)
                    }
                  />
                  {fieldError ? (
                    <p id={`${inputId}-error`} className="text-sm text-danger">
                      {fieldError}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
          {showErrorSummary && fixedErrors.total ? (
            <p id="fixed-uma-total-error" className="text-sm text-danger">
              {fixedErrors.total.message}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="min-w-0 space-y-3">
          <p className="text-sm text-text-muted">
            各順位の点は、返し点を超えた人数に対応する行から適用します。
          </p>
          <div className="min-w-0">
            <table className="block w-full table-fixed md:table">
              <caption className="sr-only">
                返し点を超えた人数ごとの順位点
              </caption>
              <thead className="hidden md:table-header-group">
                <tr>
                  <th
                    scope="col"
                    className="w-32 border-b border-border px-3 py-2 text-left text-sm font-semibold text-foreground"
                  >
                    浮き人数
                  </th>
                  {RANKS.map(({ key, label }) => (
                    <th
                      key={key}
                      id={`floating-count-column-${key}`}
                      scope="col"
                      className="border-b border-border px-3 py-2 text-left text-sm font-semibold text-foreground"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="grid gap-3 md:table-row-group md:gap-0">
                {FLOATING_COUNTS.map((floatingCount) => {
                  const rowId = `floating-count-row-${floatingCount}`;
                  const rowErrors = floatingErrors[floatingCount];
                  const totalError = showErrorSummary
                    ? rowErrors?.total?.message
                    : undefined;

                  return (
                    <tr
                      id={rowId}
                      key={floatingCount}
                      className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-2 rounded-control border border-border bg-white p-3 md:table-row md:border-0 md:bg-transparent md:p-0"
                    >
                      <th
                        id={`floating-count-heading-${floatingCount}`}
                        scope="row"
                        className="col-span-2 block text-left text-base font-semibold text-foreground md:table-cell md:border-b md:border-border md:px-3 md:py-3 md:text-sm"
                      >
                        {floatingCount}人浮き
                        {totalError ? (
                          <span
                            id={`floating-count-${floatingCount}-total-error`}
                            className="mt-1 block text-sm font-normal text-danger"
                          >
                            {totalError}
                          </span>
                        ) : null}
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
                          <td
                            key={rank}
                            className="block min-w-0 md:table-cell md:border-b md:border-border md:px-2 md:py-3"
                          >
                            <label
                              htmlFor={inputId}
                              className="mb-1 block text-sm font-medium text-foreground md:sr-only"
                            >
                              {label}
                            </label>
                            <input
                              id={inputId}
                              type="number"
                              step="1"
                              inputMode="numeric"
                              value={floatingCountUma[floatingCount][rank]}
                              disabled={disabled}
                              aria-invalid={
                                fieldError || totalError ? true : undefined
                              }
                              aria-describedby={describedBy || undefined}
                              aria-labelledby={`floating-count-heading-${floatingCount} floating-count-column-${rank}`}
                              className={inputClassName}
                              onChange={(event) =>
                                onFloatingCountUmaChange(
                                  floatingCount,
                                  rank,
                                  event.currentTarget.value
                                )
                              }
                            />
                            {fieldError ? (
                              <p
                                id={`${inputId}-error`}
                                className="mt-1 text-sm text-danger"
                              >
                                {fieldError}
                              </p>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export { LeagueRuleEditor };
