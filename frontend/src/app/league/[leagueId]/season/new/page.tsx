"use client";

import * as React from "react";

import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { Select } from "@/components/ui/select";

import { useSeasonNew } from "./hooks";

const SeasonNewPage: React.FC = () => {
  const {
    leagueId,
    leagueName,
    leagueMembers,
    selectedMembers,
    seasonName,
    status,
    loading,
    isSubmitting,
    error,
    handleMemberToggle,
    handleSeasonNameChange,
    setStatus,
    handleSubmit,
  } = useSeasonNew();

  if (loading) {
    return (
      <AppShell mainClassName="min-h-screen bg-background font-jp">
        <LoadingState
          label="シーズン作成画面を読み込んでいます…"
          className="min-h-[calc(100vh-4rem)]"
        />
      </AppShell>
    );
  }

  return (
    <AppShell mainClassName="min-h-screen bg-background font-jp">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">シーズン作成</h1>
          <p className="mt-2 text-sm text-text-muted">
            対象リーグ：{leagueName}
          </p>
        </div>

        <Card bodyClassName="space-y-6">
          <Input
            label="シーズン名"
            placeholder="例: 2026シーズン"
            value={seasonName}
            onChange={handleSeasonNameChange}
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

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-foreground">参加者</h2>
                <p className="mt-1 text-xs text-text-muted">
                  このシーズンの参加者を選択してください。
                </p>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-strong">
                {Object.keys(selectedMembers).length}人選択
              </span>
            </div>
            {leagueMembers.length === 0 ? (
              <EmptyState
                title="リーグメンバーがいません"
                description="Seasonを作成するにはLeagueにメンバーが必要です。"
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {leagueMembers.map((member) => {
                  const isSelected = member.userId in selectedMembers;
                  return (
                    <label
                      key={member.userId}
                      className={`cursor-pointer rounded-control border p-3 text-center text-sm transition-colors ${isSelected ? "border-brand-600 bg-brand-50 text-brand-strong" : "border-border bg-white text-text-muted hover:border-brand-400"}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleMemberToggle(member.userId)}
                        className="sr-only"
                      />
                      {member.userName}
                    </label>
                  );
                })}
              </div>
            )}
          </section>

          {error ? <ErrorState message={error} /> : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || leagueMembers.length === 0}
            >
              シーズンを作成
            </Button>
            <Link
              href={leagueId ? `/league/${leagueId}` : "/"}
              className="text-sm text-text-muted underline-offset-4 hover:text-foreground hover:underline"
            >
              キャンセル
            </Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
};

export default SeasonNewPage;
