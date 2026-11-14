"use client";
import * as React from "react";

import { Button } from "@/components/v2/ui/button";
import { Dialog } from "@/components/v2/ui/dialog";
import { Table } from "@/components/v2/ui/table";

import type { ApiLeague } from "@/lib/api/contracts";

export const LeagueRuleSummary = ({ rule }: { rule: ApiLeague["rule"] }) => {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const uma = rule.uma;
  return (
    <div className="space-y-2 text-v2-caption text-v2-text-secondary">
      <p>
        ウマ{" "}
        {uma.mode === "fixed" ? (
          [uma.first, uma.second, uma.third, uma.fourth]
            .filter((value) => value !== null)
            .join(" / ")
        ) : (
          <button
            type="button"
            className="text-v2-brand-strong underline"
            onClick={() => dialogRef.current?.showModal()}
          >
            浮き人数別（詳細）
          </button>
        )}{" "}
        · チョンボ罰符 {rule.chomboPenaltyPoints ?? 0} pt
      </p>
      <p>
        席順ローテーション {rule.rotateSeatOrder ? "あり" : "なし"} · 卓外供託{" "}
        {rule.allowOffTableKyotaku ? "あり" : "なし"}
      </p>
      {uma.mode === "floatingCount" && (
        <Dialog
          ref={dialogRef}
          aria-labelledby="floating-uma-title"
          className="m-auto w-[calc(100%-32px)] max-w-[342px] rounded-v2-panel bg-v2-surface p-6 text-v2-text shadow-v2-feature backdrop:bg-black/40"
        >
          <h2 id="floating-uma-title" className="text-v2-heading-2 font-bold">
            浮き人数別の順位点
          </h2>
          <p className="mt-2 text-v2-caption text-v2-text-secondary">
            返し点（{rule.oka.returnPoints.toLocaleString("ja-JP")}
            点）以上の人数ごとの順位点です。
          </p>
          <Table plain className="mt-4 table-fixed text-center text-v2-caption">
            <thead className="bg-v2-brand-soft">
              <tr>
                <th scope="col">浮き人数</th>
                <th scope="col">1位</th>
                <th scope="col">2位</th>
                <th scope="col">3位</th>
                <th scope="col">4位</th>
              </tr>
            </thead>
            <tbody>
              {([0, 1, 2, 3, 4] as const).map((count) => {
                const row = uma.pointsByFloatingCount[count];
                return (
                  <tr key={count} className="border-b border-v2-border-subtle">
                    <th scope="row" className="py-2">
                      {count}人
                    </th>
                    {[row.first, row.second, row.third, row.fourth].map(
                      (value, index) => (
                        <td key={index}>{value}</td>
                      )
                    )}
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <Button
            variant="secondary"
            fullWidth
            className="mt-5"
            onClick={() => dialogRef.current?.close()}
          >
            閉じる
          </Button>
        </Dialog>
      )}
    </div>
  );
};
