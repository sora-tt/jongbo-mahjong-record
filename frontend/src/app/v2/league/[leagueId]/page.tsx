"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { useLeaguePage } from "@/features/league/hooks/use-league-page";
import {
  formatScore,
  formatStreak,
} from "@/features/league/model/format-record";
import { LeagueMembers } from "@/features/league/ui/v2/league-members";
import { LeagueRecord } from "@/features/league/ui/v2/league-record";
import { LeagueRuleSummary } from "@/features/league/ui/v2/league-rule-summary";
import { formatDetailTitle } from "@/lib/name-suffix";

import { AppShell } from "@/components/v2/layout/app-shell";
import { ButtonLink } from "@/components/v2/ui/button-link";
import { Chip } from "@/components/v2/ui/chip";
import { PageLoading } from "@/components/v2/ui/page-loading";
import { Panel } from "@/components/v2/ui/panel";
import { Status } from "@/components/v2/ui/status";

const LeaguePage = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const {
    league,
    longestWinStreak,
    longestLoseStreak,
    currentHighestScore,
    currentLowestScore,
    leagueSeasons,
    seasonsLoading,
    seasonsError,
    retrySeasons,
    members,
    membersLoading,
    membersError,
    loading,
    notFound,
    error,
    retry,
  } = useLeaguePage("/v2");
  const shellProps = {
    title: loading ? "" : formatDetailTitle(league?.name, "リーグ"),
    backHref: "/v2",
    settingsHref: `/v2/league/${leagueId}/edit`,
    bottomNav: true,
  };
  if (loading) {
    return (
      <AppShell {...shellProps}>
        <PageLoading label="リーグ情報を読み込んでいます…" bottomNav />
      </AppShell>
    );
  }
  if (error || notFound || !league)
    return (
      <AppShell {...shellProps}>
        <main className="mx-auto max-w-[480px] p-4">
          <Status
            message={error ?? "リーグが見つかりません"}
            onRetry={error ? retry : undefined}
          />
        </main>
      </AppShell>
    );
  const records = [
    {
      label: "連勝記録",
      record: longestWinStreak,
      value: longestWinStreak
        ? formatStreak({ count: longestWinStreak.value, unit: "連勝" })
        : "— 連勝",
    },
    {
      label: "連敗記録",
      record: longestLoseStreak,
      value: longestLoseStreak
        ? formatStreak({ count: longestLoseStreak.value, unit: "連敗" })
        : "— 連敗",
    },
    {
      label: "最高スコア",
      record: currentHighestScore,
      value: currentHighestScore
        ? formatScore({ score: currentHighestScore.value })
        : "— pt",
    },
    {
      label: "最低スコア",
      record: currentLowestScore,
      value: currentLowestScore
        ? formatScore({ score: currentLowestScore.value })
        : "— pt",
    },
  ];
  return (
    <AppShell {...shellProps}>
      <main className="mx-auto flex max-w-[480px] flex-col gap-4 px-4 pb-28 pt-4">
        <div className="grid grid-cols-2 gap-4">
          {records.map((item) => (
            <LeagueRecord
              key={item.label}
              label={item.label}
              name={item.record?.userName}
              value={item.value}
            />
          ))}
        </div>
        <Panel className="space-y-3">
          <h2 className="text-v2-heading-2 font-bold">ルール</h2>
          <p className="text-v2-label font-normal">
            <Chip variant="selected" size="sm" className="mr-2">
              {league.rule.gameType === "sanma" ? "三麻" : "四麻"}
            </Chip>
            持ち点 {league.rule.oka.startingPoints.toLocaleString("ja-JP")} ·
            返し点 {league.rule.oka.returnPoints.toLocaleString("ja-JP")}
          </p>
          <LeagueRuleSummary rule={league.rule} />
        </Panel>
        <Panel>
          <div className="mb-2 flex justify-between">
            <h2 className="text-v2-heading-2 font-bold">参加メンバー</h2>
            <span className="text-v2-caption text-v2-text-secondary">
              {members.length} 人
            </span>
          </div>
          {membersLoading ? (
            <Status loading message="リーグ参加者を読み込んでいます…" />
          ) : membersError ? (
            <Status message={membersError} />
          ) : members.length ? (
            <LeagueMembers members={members} league={league} />
          ) : (
            <p className="text-v2-caption text-v2-text-secondary">
              参加者がいません。
            </p>
          )}
        </Panel>
        <Panel>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-v2-heading-2 font-bold">シーズン</h2>
            <ButtonLink href={`/v2/league/${league.id}/season/new`} size="sm">
              新規作成
            </ButtonLink>
          </div>
          {seasonsLoading ? (
            <Status loading message="シーズン一覧を読み込んでいます…" />
          ) : seasonsError ? (
            <Status message={seasonsError} onRetry={retrySeasons} />
          ) : leagueSeasons.length ? (
            leagueSeasons.map((season) => (
              <Link
                key={season.id}
                href={`/v2/league/${league.id}/season/${season.id}`}
                className="flex min-h-[72px] items-center justify-between gap-3 border-b border-v2-border-subtle py-3 last:border-0"
              >
                <div>
                  <p className="font-semibold">{season.name}</p>
                  <p className="mt-1 text-v2-caption text-v2-text-secondary">
                    <Chip
                      variant={
                        season.status === "active" ? "selected" : "neutral"
                      }
                      size="sm"
                      className="mr-2"
                    >
                      {season.status === "active" ? "進行中" : "終了"}
                    </Chip>
                    {season.totalMatchCount}局
                  </p>
                </div>
                <span className="text-v2-caption text-v2-brand-strong">
                  詳細 →
                </span>
              </Link>
            ))
          ) : (
            <p className="py-3 text-v2-caption text-v2-text-secondary">
              まだシーズンが作成されていません。
            </p>
          )}
        </Panel>
      </main>
    </AppShell>
  );
};
export default LeaguePage;
