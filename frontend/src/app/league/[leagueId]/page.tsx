"use client";

import * as React from "react";

import { Pencil } from "lucide-react";

import Link from "next/link";

import { LeagueRuleSummary } from "@/features/league/ui/league-rule-summary";
import { buildStatisticsHref } from "@/features/statistics/model/page";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

import { formatScore, formatStreak } from "../utils";
import { useLeaguePage } from "./hooks";

const LeaguePage: React.FC = () => {
  const {
    league,
    longestWinStreak,
    longestLoseStreak,
    currentHighestScore,
    currentLowestScore,
    leagueSeasons,
    members,
    membersLoading,
    membersError,
    loading,
    error,
    retry,
  } = useLeaguePage();

  if (loading) {
    return (
      <AppShell mainClassName="min-h-screen bg-background font-jp">
        <LoadingState
          label="リーグ情報を読み込んでいます…"
          className="min-h-[calc(100vh-4rem)]"
        />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell mainClassName="min-h-screen bg-background font-jp">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ErrorState message={error} onRetry={retry} />
        </div>
      </AppShell>
    );
  }

  if (!league) {
    return null;
  }

  const records = [
    {
      label: "連勝記録",
      record: longestWinStreak,
      value: longestWinStreak
        ? formatStreak({ count: longestWinStreak.value, unit: "連勝" })
        : "データなし",
    },
    {
      label: "連敗記録",
      record: longestLoseStreak,
      value: longestLoseStreak
        ? formatStreak({ count: longestLoseStreak.value, unit: "連敗" })
        : "データなし",
    },
    {
      label: "最高スコア",
      record: currentHighestScore,
      value: currentHighestScore
        ? formatScore({ score: currentHighestScore.value })
        : "データなし",
    },
    {
      label: "最低スコア",
      record: currentLowestScore,
      value: currentLowestScore
        ? formatScore({ score: currentLowestScore.value })
        : "データなし",
    },
  ];
  const isFloatingCountUma = league.rule.uma.mode === "floatingCount";

  return (
    <AppShell mainClassName="min-h-screen bg-background font-jp">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">{league.name}</h1>
          <Link href={`/league/${league.id}/edit`}>
            <Button variant="secondary" size="sm">
              <Pencil className="h-4 w-4" />
              リーグを編集
            </Button>
          </Link>
        </header>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="現在のシーズン">
            {league.activeSeason ? (
              <Link
                href={`/league/${league.id}/season/${league.activeSeason.id}`}
                className="font-medium text-brand-strong underline-offset-4 hover:underline"
              >
                {league.activeSeason.name}
              </Link>
            ) : (
              <p className="text-sm text-text-muted">
                現在進行中のシーズンはありません。
              </p>
            )}
          </Card>
          <Card title="ルール">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-text-muted">ゲーム種別</dt>
              <dd className="text-right text-foreground">
                {league.rule.gameType === "sanma" ? "三麻" : "四麻"}
              </dd>
              <dt className="text-text-muted">持ち点 / 返し点</dt>
              <dd className="text-right text-foreground">
                {league.rule.oka.startingPoints.toLocaleString("ja-JP")} /{" "}
                {league.rule.oka.returnPoints.toLocaleString("ja-JP")}
              </dd>
              {!isFloatingCountUma ? (
                <>
                  <dt className="text-text-muted">ウマ</dt>
                  <dd className="text-right text-foreground">
                    <LeagueRuleSummary rule={league.rule} />
                  </dd>
                </>
              ) : null}
            </dl>
            {isFloatingCountUma ? (
              <div className="mt-4">
                <LeagueRuleSummary rule={league.rule} />
              </div>
            ) : null}
          </Card>
        </section>

        <section className="grid grid-cols-2 gap-4">
          {records.map(({ label, record, value }) => (
            <Card key={label} bodyClassName="space-y-2">
              <h2 className="text-sm font-semibold text-text-muted">{label}</h2>
              <p className="text-xs text-text-muted">
                {record?.userName ?? "データなし"}
              </p>
              <p className="text-2xl font-bold text-brand-strong">{value}</p>
            </Card>
          ))}
        </section>

        <section className="space-y-4" aria-labelledby="league-members-heading">
          <div>
            <h2
              id="league-members-heading"
              className="text-xl font-bold text-foreground"
            >
              参加者別の成績
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              名前を選ぶと、このリーグの通算成績を確認できます。
            </p>
          </div>
          {membersLoading ? (
            <LoadingState label="リーグ参加者を読み込んでいます…" />
          ) : membersError ? (
            <ErrorState message={membersError} />
          ) : members.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {members.map((member) => (
                <Link
                  key={String(member.userId)}
                  href={buildStatisticsHref({
                    scope: {
                      scopeType: "league",
                      leagueId: String(league.id),
                      gameType: league.rule.gameType,
                    },
                    targetUserId: String(member.userId),
                    scopeLabel: league.name,
                    returnTo: `/league/${league.id}`,
                  })}
                  className="flex min-h-12 items-center justify-between rounded-control border border-border bg-white px-4 py-3 text-sm transition-colors hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <span className="font-medium text-foreground">
                    {member.userName}
                  </span>
                  <span className="text-brand-strong">成績を見る</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">参加者がいません。</p>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                シーズン一覧
              </h2>
            </div>
            <Link href={`/league/${league.id}/season/new`}>
              <Button size="sm">シーズンを作成</Button>
            </Link>
          </div>

          {leagueSeasons.length === 0 ? (
            <EmptyState
              className="!bg-transparent"
              title="まだシーズンが作成されていません"
              description="シーズンを作成して対局記録を始めましょう。"
              action={
                <Link href={`/league/${league.id}/season/new`}>
                  <Button>シーズンを作成</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {leagueSeasons.map((season) => (
                <Link
                  key={season.id}
                  href={`/league/${league.id}/season/${season.id}`}
                  className={`rounded-surface border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${season.status === "active" ? "border-brand-500" : "border-border"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {season.name}
                      </h3>
                      <div className="mt-2 space-y-1 text-sm text-text-muted">
                        <p>参加者：{season.memberCount}人</p>
                        <p>対局数：{season.totalMatchCount}局</p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${season.status === "active" ? "bg-brand-50 text-brand-strong" : "bg-surface-muted text-text-muted"}`}
                    >
                      {season.status === "active" ? "進行中" : "終了"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
};

export default LeaguePage;
