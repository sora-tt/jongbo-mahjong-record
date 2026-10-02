import * as React from "react";

import type { ApiLeague } from "@/lib/api/contracts";

type Props = {
  rule: ApiLeague["rule"];
};

const FLOATING_COUNTS = [0, 1, 2, 3, 4] as const;
const RANKS = [
  { key: "first", label: "1位" },
  { key: "second", label: "2位" },
  { key: "third", label: "3位" },
  { key: "fourth", label: "4位" },
] as const;

export const LeagueRuleSummary: React.FC<Props> = ({ rule }) => {
  const uma = rule.uma;
  const externalRuleDetails = (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-border pt-3 text-sm">
      <dt className="text-text-muted">チョンボ罰符</dt>
      <dd className="text-right font-medium text-foreground">
        {rule.chomboPenaltyPoints ?? 0}pt
      </dd>
      <dt className="text-text-muted">卓外供託</dt>
      <dd className="text-right font-medium text-foreground">
        {rule.allowOffTableKyotaku ? "あり" : "なし"}
      </dd>
    </dl>
  );

  if (uma.mode === "fixed") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-foreground">
          {[uma.first, uma.second, uma.third, uma.fourth]
            .filter((value): value is number => value !== null)
            .join(" / ")}
        </p>
        {externalRuleDetails}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <section
        className="min-w-0 space-y-3"
        aria-labelledby="floating-count-rule-title"
      >
        <div className="space-y-1">
          <h3
            id="floating-count-rule-title"
            className="font-semibold text-foreground"
          >
            浮き人数別順位点
          </h3>
          <p
            id="floating-count-rule-basis"
            className="text-sm leading-relaxed text-text-muted"
          >
            浮き人数は、素点（raw score）が返し点（
            {rule.oka.returnPoints.toLocaleString("ja-JP")}点）以上の人数です。
            返し点と同点も含みます。
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          {FLOATING_COUNTS.map((floatingCount) => {
            const points = uma.pointsByFloatingCount[floatingCount];
            const headingId = `floating-count-summary-${floatingCount}-title`;

            return (
              <article
                key={floatingCount}
                className="min-w-0 rounded-surface border border-border bg-white p-4 shadow-sm"
                aria-labelledby={headingId}
              >
                <h4 id={headingId} className="font-semibold text-foreground">
                  {floatingCount}人浮き
                </h4>
                <table
                  className="mt-2 w-full table-fixed border-collapse text-sm"
                  aria-describedby="floating-count-rule-basis"
                >
                  <caption className="sr-only">
                    {floatingCount}人浮きの場合の順位点
                  </caption>
                  <thead>
                    <tr className="border-b border-border text-text-muted">
                      <th
                        scope="col"
                        className="w-1/2 py-2 text-left font-medium"
                      >
                        順位
                      </th>
                      <th
                        scope="col"
                        className="w-1/2 py-2 text-right font-medium"
                      >
                        順位点
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {RANKS.map(({ key, label }) => (
                      <tr
                        key={key}
                        className="border-b border-border last:border-0"
                      >
                        <th
                          scope="row"
                          className="py-2 text-left font-medium text-foreground"
                        >
                          {label}
                        </th>
                        <td className="py-2 text-right tabular-nums text-foreground">
                          {points[key]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            );
          })}
        </div>
      </section>
      {externalRuleDetails}
    </div>
  );
};
