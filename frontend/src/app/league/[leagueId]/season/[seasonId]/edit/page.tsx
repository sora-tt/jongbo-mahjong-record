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

import { useSeasonEdit } from "./hooks";

const SeasonEditPage: React.FC = () => {
  const {
    leagueId,
    seasonId,
    seasonName,
    status,
    members,
    candidateMembers,
    selectedMembers,
    isLoading,
    areLeagueMembersLoading,
    leagueMembersError,
    isLoaded,
    notFound,
    isSubmitting,
    error,
    setSeasonName,
    setStatus,
    handleMemberToggle,
    handleSubmit,
    retry,
    retryLeagueMembers,
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

  if (notFound) {
    return (
      <AppShell mainClassName="min-h-screen bg-background font-jp">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <EmptyState
            title="シーズンが見つかりません"
            description="リーグ詳細からシーズンを選び直してください。"
            action={
              <Link href={`/league/${leagueId}`}>
                <Button variant="secondary">リーグ詳細へ戻る</Button>
              </Link>
            }
          />
        </div>
      </AppShell>
    );
  }

  if (error && !isLoaded) {
    return (
      <AppShell mainClassName="min-h-screen bg-background font-jp">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <ErrorState message={error} onRetry={retry} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell mainClassName="min-h-screen bg-background font-jp">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">シーズン設定</h1>
          <p className="mt-2 text-sm text-text-muted">
            既存の参加者を維持したまま、リーグ参加者を追加できます。対局記録後も追加できます。
          </p>
        </div>

        <Card
          title="参加中のメンバー"
          meta="既存メンバーは維持されます"
          bodyClassName="flex flex-wrap gap-2"
        >
          {members.length > 0 ? (
            members.map((member) => (
              <span
                key={member.userId}
                className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-strong"
              >
                {member.userName}
              </span>
            ))
          ) : (
            <p className="text-sm text-text-muted">参加者情報がありません。</p>
          )}
        </Card>

        <Card
          title="参加者を追加"
          meta={`${Object.keys(selectedMembers).length}人選択`}
        >
          <fieldset className="space-y-4" disabled={isSubmitting}>
            <legend className="sr-only">
              リーグ参加者から追加するメンバー
            </legend>
            <p id="season-members-help" className="text-sm text-text-muted">
              追加する参加者を選択してください。現在の参加者は候補に表示されません。
            </p>

            {areLeagueMembersLoading ? (
              <LoadingState
                label="リーグ参加者を読み込んでいます…"
                className="p-4"
              />
            ) : leagueMembersError ? (
              <ErrorState
                message={leagueMembersError}
                onRetry={retryLeagueMembers}
              />
            ) : candidateMembers.length === 0 ? (
              <EmptyState
                title="追加できる参加者がいません"
                description="リーグ参加者がいないか、全員がこのシーズンに参加しています。"
              />
            ) : (
              <div
                role="group"
                aria-describedby="season-members-help"
                className="grid grid-cols-1 gap-2 sm:grid-cols-2"
              >
                {candidateMembers.map((member) => {
                  const isSelected = member.userId in selectedMembers;
                  return (
                    <label
                      key={member.userId}
                      className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${isSelected ? "border-brand-500 bg-brand-50 text-foreground" : "border-border bg-white text-foreground hover:border-brand-400"}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleMemberToggle(member.userId)}
                        className="h-4 w-4 shrink-0 accent-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                      />
                      <span>{member.userName}</span>
                    </label>
                  );
                })}
              </div>
            )}

            <p
              className="text-xs text-text-muted"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {Object.keys(selectedMembers).length}人を追加する予定です。
            </p>
          </fieldset>
        </Card>

        <section className="space-y-5 rounded-surface border border-border bg-white p-6 shadow-sm">
          <div className="space-y-1.5">
            <label
              htmlFor="season-name"
              className="block text-sm font-medium text-foreground"
            >
              シーズン名 <span className="text-danger">*</span>
            </label>
            <div className="flex items-center overflow-hidden rounded-lg border border-border bg-white transition-colors focus-within:border-brand-strong">
              <Input
                id="season-name"
                containerClassName="min-w-0 flex-1 space-y-0"
                className="rounded-none border-0 shadow-none hover:border-transparent focus:border-0"
                value={seasonName}
                onChange={(event) => setSeasonName(event.target.value)}
                required
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
