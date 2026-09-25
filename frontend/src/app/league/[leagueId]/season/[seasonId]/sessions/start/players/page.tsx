"use client";

import * as React from "react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

import { usePlayerSelect } from "./hooks";

const WIND_LABELS = {
  east: "東",
  south: "南",
  west: "西",
  north: "北",
} as const;

const PlayerSelectPage: React.FC = () => {
  const {
    seasonName,
    gameType,
    requiredWinds,
    players,
    isLoading,
    isSubmitting,
    error,
    canSubmit,
    retry,
    getPositionOptions,
    onPlayerChange,
    handleSubmit,
    handleBack,
    hasCandidates,
  } = usePlayerSelect();

  return (
    <AppShell mainClassName="min-h-screen bg-background font-jp">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col justify-center px-4 py-8">
        {isLoading ? (
          <LoadingState label="プレイヤー候補を読み込んでいます…" />
        ) : null}
        {!isLoading && error ? (
          <ErrorState message={error} onRetry={retry} />
        ) : null}
        {!isLoading && !error && !hasCandidates ? (
          <EmptyState
            title="選択できる参加者が不足しています"
            description="Sessionには三麻で3人、四麻で4人の参加者が必要です。"
            action={
              <Button variant="secondary" onClick={handleBack}>
                戻る
              </Button>
            }
          />
        ) : null}
        {!isLoading && !error && hasCandidates ? (
          <div className="rounded-surface border border-border bg-white p-6 shadow-sm">
            <p className="text-sm text-text-muted">{seasonName}</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">
              参加者を選択
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              {gameType === "sanma" ? "三麻（3人）" : "四麻（4人）"}
              。Session内では参加者が固定されます。
            </p>
            <div className="mt-6 space-y-4">
              {requiredWinds.map((wind) => (
                <label
                  key={wind}
                  className="block text-sm font-medium text-foreground"
                >
                  {WIND_LABELS[wind]}
                  <div className="mt-1">
                    <Dropdown
                      defaultOption="プレイヤーを選択"
                      options={getPositionOptions(wind)}
                      value={players[wind]}
                      onChange={onPlayerChange(wind)}
                      disabled={isSubmitting}
                    />
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting ? "準備中…" : "決定"}
              </Button>
              <Button
                variant="secondary"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                戻る
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
};

export default PlayerSelectPage;
