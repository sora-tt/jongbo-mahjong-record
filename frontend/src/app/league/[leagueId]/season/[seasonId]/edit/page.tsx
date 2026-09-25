"use client";

import * as React from "react";

import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { Select } from "@/components/ui/select";

import { useSeasonEdit } from "./hooks";

const SeasonEditPage: React.FC = () => {
  const {
    leagueId,
    seasonId,
    seasonName,
    status,
    isLoading,
    isSubmitting,
    error,
    setSeasonName,
    setStatus,
    handleSubmit,
  } = useSeasonEdit();

  if (isLoading) {
    return (
      <AppShell mainClassName="min-h-screen bg-background font-jp">
        <LoadingState
          label="シーズン情報を読み込んでいます…"
          className="min-h-[calc(100vh-4rem)]"
        />
      </AppShell>
    );
  }

  return (
    <AppShell mainClassName="min-h-screen bg-background font-jp">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">シーズン設定</h1>
          <p className="mt-2 text-sm text-text-muted">
            シーズン名と状態のみ変更できます。参加者は変更できません。
          </p>
        </div>

        <section className="space-y-5 rounded-surface border border-border bg-white p-6 shadow-sm">
          <Input
            label="シーズン名"
            value={seasonName}
            onChange={(event) => setSeasonName(event.target.value)}
            required
          />
          <Select
            label="状態"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "active" | "archived")
            }
          >
            <option value="active">進行中</option>
            <option value="archived">終了</option>
          </Select>

          {error ? <ErrorState message={error} /> : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              変更を適用
            </Button>
            <Link
              href={
                leagueId && seasonId
                  ? `/league/${leagueId}/season/${seasonId}`
                  : "/"
              }
              className="text-sm text-text-muted underline-offset-4 hover:text-foreground hover:underline"
            >
              キャンセル
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default SeasonEditPage;
