"use client";

import * as React from "react";

import { ArrowLeft, CalendarDays, Check, Type, UsersRound } from "lucide-react";

import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";

import { useSeasonNew } from "./hooks";

const SeasonNewPage: React.FC = () => {
  const {
    leagueId,
    leagueName,
    leagueMembers,
    selectedMembers,
    seasonName,
    loading,
    isSubmitting,
    error,
    handleMemberToggle,
    handleSeasonNameChange,
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
      <div className="mx-auto flex w-full max-w-[390px] flex-col gap-4 px-4 pb-8 pt-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-200 text-white">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-bold text-foreground">シーズン作成</h1>
        </div>

        <Card
          className="rounded-xl border-2 border-brand-200 shadow-none"
          bodyClassName="space-y-4 p-4"
        >
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">対象リーグ</p>
            <p className="text-sm text-text-muted">{leagueName}</p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="season-name"
              className="flex items-center gap-2 text-sm font-semibold text-foreground"
            >
              <Type className="h-4 w-4 text-slate-700" aria-hidden="true" />
              シーズン名
            </label>
            <div className="flex items-center overflow-hidden rounded-lg border border-border bg-white transition-colors focus-within:border-brand-strong">
              <Input
                id="season-name"
                containerClassName="min-w-0 flex-1 space-y-0"
                className="h-9 rounded-none border-0 px-3 shadow-none hover:border-transparent focus:border-0"
                placeholder="例: 2026"
                value={seasonName}
                onChange={handleSeasonNameChange}
                aria-describedby="season-name-suffix"
              />
              <span
                id="season-name-suffix"
                className="shrink-0 border-l border-border bg-surface-muted px-3 py-2 text-sm text-text-muted"
              >
                シーズン
              </span>
            </div>
          </div>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <UsersRound
                  className="h-4 w-4 text-slate-700"
                  aria-hidden="true"
                />
                参加者
              </h2>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-200 px-4 py-1 text-xs font-semibold text-foreground">
                <UsersRound
                  className="h-4 w-4 text-brand-600"
                  aria-hidden="true"
                />
                {Object.keys(selectedMembers).length}人選択
              </span>
            </div>
            {leagueMembers.length === 0 ? (
              <EmptyState
                title="リーグメンバーがいません"
                description="Seasonを作成するにはLeagueにメンバーが必要です。"
              />
            ) : (
              <div className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-white p-4">
                {leagueMembers.map((member) => {
                  const isSelected = member.userId in selectedMembers;
                  return (
                    <label
                      key={member.userId}
                      className={`relative flex min-h-10 cursor-pointer items-center justify-center gap-1 rounded-lg border-2 p-2 text-center text-sm font-semibold transition-colors ${isSelected ? "border-brand-500 bg-brand-50 text-foreground shadow-sm" : "border-slate-300 bg-white text-foreground hover:border-brand-400"}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleMemberToggle(member.userId)}
                        className="sr-only"
                        aria-label={`${member.userName}を選択`}
                      />
                      {member.userName}
                      {isSelected ? (
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white">
                          <Check className="h-3 w-3" aria-hidden="true" />
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            )}
          </section>

          {error ? <ErrorState message={error} /> : null}

          <div className="flex flex-col items-center gap-3 pt-1">
            <Button
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || leagueMembers.length === 0}
              size="lg"
              className="min-w-[144px] rounded-xl"
            >
              シーズンを作成
            </Button>
            <Link
              href={leagueId ? `/league/${leagueId}` : "/"}
              className="inline-flex cursor-pointer items-center gap-1 text-sm text-text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              リーグへ戻る
            </Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
};

export default SeasonNewPage;
