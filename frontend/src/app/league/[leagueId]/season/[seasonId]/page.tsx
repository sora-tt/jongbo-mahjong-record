"use client";

import * as React from "react";

import clsx from "clsx";
import { Calendar, Crown, Pencil, Trash2 } from "lucide-react";

import Link from "next/link";

import { PointProgressionChart } from "@/features/statistics/ui/PointProgressionChart";
import { StandingsTable } from "@/features/statistics/ui/StandingsTable";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { HeaderCard } from "@/components/ui/header-card";
import { LoadingState } from "@/components/ui/loading-state";
import { SectionCard } from "@/components/ui/section-card";

import { useSeasonPage } from "./hooks";

const formatDate = (value: string | null) => {
  if (!value) {
    return "未記録";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const SeasonPage: React.FC = () => {
  const {
    leagueId,
    seasonId,
    leagueName,
    season,
    seasonNotFound,
    sessions,
    titles,
    pointProgressionChart,
    chartSeries,
    visibleSeries,
    visibleUserIds,
    loading,
    sessionsLoading,
    sessionsError,
    error,
    deleteTargetSession,
    deletingSessionId,
    isSessionDeleteRequestInFlight,
    sessionDeleteError,
    sessionDeleteRetryAllowed,
    sessionDeleteVerificationPending,
    isRefreshingSessionDelete,
    retry,
    retrySessions,
    handleRequestDeleteSession,
    handleCancelDeleteSession,
    handleRetrySessionDeleteStatus,
    handleConfirmDeleteSession,
    handleStartRecording,
    handleToggleChartSeries,
  } = useSeasonPage();
  const deleteDialogTitleRef = React.useRef<HTMLHeadingElement | null>(null);
  const previousDeleteTargetIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (deleteTargetSession) {
      previousDeleteTargetIdRef.current = String(deleteTargetSession.id);
      deleteDialogTitleRef.current?.focus();
      return;
    }

    const previousDeleteTargetId = previousDeleteTargetIdRef.current;
    if (previousDeleteTargetId) {
      if (
        deletingSessionId ||
        isRefreshingSessionDelete ||
        loading ||
        sessionsLoading
      ) {
        return;
      }

      window.requestAnimationFrame(() => {
        const deleteTrigger = document.getElementById(
          `delete-session-${previousDeleteTargetId}`
        );
        const focusTarget =
          deleteTrigger ??
          document.getElementById("session-list-section") ??
          document.getElementById("season-detail-error-state") ??
          document.getElementById("season-detail-empty-state");
        focusTarget?.focus();
      });
      previousDeleteTargetIdRef.current = null;
    }
  }, [
    deleteTargetSession,
    deletingSessionId,
    error,
    isRefreshingSessionDelete,
    loading,
    sessionsLoading,
  ]);

  if (loading && !deleteTargetSession) {
    return (
      <AppShell mainClassName="min-h-screen bg-background font-jp">
        <LoadingState
          label="シーズン情報を読み込んでいます…"
          className="min-h-[calc(100vh-4rem)]"
        />
      </AppShell>
    );
  }

  if (error && !deleteTargetSession) {
    return (
      <AppShell mainClassName="min-h-screen bg-background font-jp">
        <div
          id="season-detail-error-state"
          tabIndex={-1}
          className="mx-auto max-w-7xl rounded-surface px-4 py-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:px-6 lg:px-8"
        >
          {sessionDeleteVerificationPending ? (
            <div className="mb-4 rounded-md bg-surface-muted p-3" role="status">
              <p className="text-sm text-text-muted">
                Sessionの状態を確認できていません。確認が完了するまで削除操作は再開できません。
              </p>
              <Button
                variant="secondary"
                className="mt-3"
                onClick={handleRetrySessionDeleteStatus}
                disabled={isRefreshingSessionDelete}
                loading={isRefreshingSessionDelete}
              >
                状態を再取得
              </Button>
            </div>
          ) : null}
          <ErrorState
            message={
              sessionDeleteError ? `${sessionDeleteError} ${error}` : error
            }
            onRetry={retry}
          />
        </div>
      </AppShell>
    );
  }

  if (!season) {
    return (
      <AppShell mainClassName="min-h-screen bg-background font-jp">
        <div
          id="season-detail-empty-state"
          tabIndex={-1}
          className="mx-auto max-w-2xl rounded-surface px-4 py-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:px-6 lg:px-8"
        >
          {sessionDeleteVerificationPending ? (
            <div className="mb-4 rounded-md bg-surface-muted p-3" role="status">
              <p className="text-sm text-text-muted">
                Sessionの状態を確認できていません。確認が完了するまで削除操作は再開できません。
              </p>
              <Button
                variant="secondary"
                className="mt-3"
                onClick={handleRetrySessionDeleteStatus}
                disabled={isRefreshingSessionDelete}
                loading={isRefreshingSessionDelete}
              >
                状態を再取得
              </Button>
            </div>
          ) : null}
          {sessionDeleteError ? (
            <p
              className="mb-3 rounded-md bg-error-bg px-3 py-2 text-sm text-error-text"
              role="alert"
            >
              {sessionDeleteError}
            </p>
          ) : null}
          <EmptyState
            title={
              seasonNotFound
                ? "シーズンが見つかりません"
                : "シーズン情報がありません"
            }
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

  return (
    <AppShell mainClassName="min-h-screen bg-background font-jp">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-6">
          <HeaderCard title={season.name} align="center">
            <span className="inline-flex items-center gap-1">
              <Calendar size={14} className="text-white" aria-hidden="true" />
              <span>
                {formatDate(season.createdAt)} 〜{" "}
                {formatDate(season.latestPlayedAt)}
              </span>
            </span>
          </HeaderCard>
        </section>

        <section className="mb-8 flex flex-wrap gap-3">
          <Button variant="brand-primary" onClick={handleStartRecording}>
            記録する
          </Button>
          <Link href={`/league/${leagueId}/season/${seasonId}/edit`}>
            <Button variant="secondary" size="lg">
              <Pencil className="h-4 w-4" aria-hidden="true" />
              シーズンを編集
            </Button>
          </Link>
        </section>

        <section className="mb-8">
          <SectionCard
            title="順位表"
            rightText={`総対局数：${season.totalMatchCount}`}
            bodyClassName="overflow-x-auto p-4"
          >
            <StandingsTable
              rows={season.standings}
              leagueId={leagueId}
              seasonId={seasonId}
              leagueName={leagueName}
              seasonName={season.name}
            />
          </SectionCard>
        </section>

        <section className="mb-8">
          <SectionCard title="総合pt推移" bodyClassName="space-y-3 p-4">
            {pointProgressionChart.isUncomputed ? (
              <div className="flex h-[clamp(200px,38vw,280px)] w-full items-center justify-center rounded-md bg-gray-50 px-4 text-center text-sm text-text-muted">
                集計が完了するとポイント推移が表示されます。
              </div>
            ) : pointProgressionChart.isEmpty ? (
              <div className="flex h-[clamp(200px,38vw,280px)] w-full items-center justify-center rounded-md bg-gray-50 px-4 text-center text-sm text-text-muted">
                まだ対局データがないため、グラフを表示できません
              </div>
            ) : visibleSeries.length > 0 ? (
              <PointProgressionChart
                data={pointProgressionChart.data}
                series={visibleSeries}
              />
            ) : (
              <div className="flex h-[clamp(200px,38vw,280px)] w-full items-center justify-center rounded-md bg-gray-50 px-4 text-center text-sm text-text-muted">
                凡例からプレイヤーを選択するとデータを表示できます
              </div>
            )}
            <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs sm:gap-x-4 sm:gap-y-1">
              {chartSeries.map((item) => (
                <button
                  key={item.userId}
                  type="button"
                  aria-pressed={visibleUserIds.includes(item.userId)}
                  className={clsx(
                    "flex min-h-7 items-center gap-1 rounded px-1 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                    visibleUserIds.some((userId) => userId === item.userId)
                      ? "opacity-100"
                      : "opacity-40"
                  )}
                  onClick={() => handleToggleChartSeries(item.userId)}
                >
                  <span
                    className={clsx(
                      "inline-block h-2 w-2 rounded-full",
                      item.colorClassName
                    )}
                  />
                  <span className="text-text-muted">{item.userName}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted">
              ※プレイヤー名をタップするとデータを非表示にできます
            </p>
          </SectionCard>
        </section>

        <section className="mb-8">
          <SectionCard title="タイトル" bodyClassName="p-4">
            {titles.length > 0 ? (
              <div className="divide-y divide-border">
                {titles.map((title) => (
                  <div
                    key={title.label}
                    className="grid grid-cols-3 items-center gap-x-4 px-2 py-3 text-sm text-text-muted"
                  >
                    <div>{title.label}</div>
                    <div className="flex items-center justify-center gap-1">
                      <Crown
                        size={16}
                        className="text-warning"
                        aria-hidden="true"
                      />
                      <span className="font-semibold text-foreground">
                        {title.playerName}
                      </span>
                    </div>
                    <div className="text-right font-semibold text-foreground">
                      {title.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="まだタイトルデータがありません"
                className="!border-0 !bg-transparent p-0"
              />
            )}
          </SectionCard>
        </section>

        <section
          id="session-list-section"
          tabIndex={-1}
          className="mb-8 rounded-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <SectionCard
            title="Session一覧"
            rightText={
              <Link
                className="font-medium text-white hover:underline"
                href={`/league/${leagueId}/season/${seasonId}/sessions/start/players`}
              >
                新しいSessionを開始
              </Link>
            }
            bodyClassName="p-4"
          >
            {sessionDeleteError && !deleteTargetSession ? (
              <p
                className="mb-3 rounded-md bg-error-bg px-3 py-2 text-sm text-error-text"
                role="alert"
              >
                {sessionDeleteError}
              </p>
            ) : null}
            {sessionDeleteVerificationPending && !deleteTargetSession ? (
              <div
                className="mb-3 rounded-md bg-surface-muted p-3"
                role="status"
              >
                <p className="text-sm text-text-muted">
                  Sessionの状態を確認できていません。確認が完了するまで削除操作は再開できません。
                </p>
                <Button
                  variant="secondary"
                  className="mt-3"
                  onClick={handleRetrySessionDeleteStatus}
                  disabled={isRefreshingSessionDelete}
                  loading={isRefreshingSessionDelete}
                >
                  状態を再取得
                </Button>
              </div>
            ) : null}
            {sessionsLoading ? (
              <LoadingState label="Session一覧を読み込んでいます…" />
            ) : sessionsError ? (
              <ErrorState message={sessionsError} onRetry={retrySessions} />
            ) : sessions.length === 0 ? (
              <EmptyState
                title="Sessionがありません"
                className="!border-0 !bg-transparent p-0"
              />
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => {
                  const sessionId = String(session.id);

                  return (
                    <div
                      key={sessionId}
                      className="rounded-control border border-border p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <Link
                          href={`/league/${leagueId}/season/${seasonId}/sessions/${session.id}/results`}
                          className="min-w-0 flex-1 rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-foreground">
                                {formatDate(session.startedAt)}
                              </p>
                              <p className="mt-1 text-sm text-text-muted">
                                {session.members
                                  .map((member) => member.userName)
                                  .join("・")}
                              </p>
                            </div>
                            <span className="rounded-full bg-surface-muted px-3 py-1 text-xs text-text-muted">
                              {session.endedAt ? "終了" : "進行中"}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                            <span>参加者 {session.memberCount}人</span>
                            <span>対局 {session.totalMatchCount}局</span>
                            {session.tableLabel ? (
                              <span>卓 {session.tableLabel}</span>
                            ) : null}
                          </div>
                        </Link>
                        <Button
                          id={`delete-session-${sessionId}`}
                          type="button"
                          variant="danger"
                          size="md"
                          className="min-h-11 self-end sm:self-auto"
                          aria-label={`Session ${formatDate(session.startedAt)} を削除`}
                          aria-haspopup="dialog"
                          disabled={
                            isSessionDeleteRequestInFlight ||
                            sessionDeleteVerificationPending ||
                            isRefreshingSessionDelete
                          }
                          onClick={() => handleRequestDeleteSession(session)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          <span>削除</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </section>
      </div>
      {deleteTargetSession ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-delete-dialog-title"
          aria-describedby="session-delete-dialog-description"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              handleCancelDeleteSession();
              return;
            }
            if (event.key !== "Tab") return;

            const focusableButtons = Array.from(
              event.currentTarget.querySelectorAll<HTMLButtonElement>(
                "button:not(:disabled)"
              )
            );
            if (focusableButtons.length === 0) {
              event.preventDefault();
              deleteDialogTitleRef.current?.focus();
              return;
            }

            const firstButton = focusableButtons[0];
            const lastButton = focusableButtons[focusableButtons.length - 1];
            if (
              event.shiftKey &&
              (document.activeElement === firstButton ||
                document.activeElement === deleteDialogTitleRef.current)
            ) {
              event.preventDefault();
              lastButton.focus();
            } else if (
              !event.shiftKey &&
              (document.activeElement === lastButton ||
                document.activeElement === deleteDialogTitleRef.current)
            ) {
              event.preventDefault();
              firstButton.focus();
            }
          }}
        >
          <div className="w-full max-w-md rounded-surface bg-white p-6 shadow-xl">
            <h2
              id="session-delete-dialog-title"
              ref={deleteDialogTitleRef}
              tabIndex={-1}
              className="text-lg font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Sessionを削除しますか？
            </h2>
            <dl className="mt-4 space-y-2 text-sm text-text-muted">
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-medium text-foreground">開始日時</dt>
                <dd>{formatDateTime(deleteTargetSession.startedAt)}</dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-medium text-foreground">参加者</dt>
                <dd>
                  {deleteTargetSession.members
                    .map((member) => member.userName)
                    .join("・")}
                </dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-medium text-foreground">対局数</dt>
                <dd>{deleteTargetSession.totalMatchCount}局</dd>
              </div>
            </dl>
            <p
              id="session-delete-dialog-description"
              className="mt-4 text-sm text-text-muted"
            >
              このSessionに含まれる対局結果もすべて削除されます。
            </p>
            {sessionDeleteError ? (
              <p className="mt-3 text-sm text-error-text" role="alert">
                {sessionDeleteError}
              </p>
            ) : null}
            {error ? (
              <p className="mt-3 text-sm text-error-text" role="alert">
                {error}
              </p>
            ) : null}
            {sessionsError && !sessionDeleteRetryAllowed ? (
              <p className="mt-3 text-sm text-error-text" role="alert">
                {sessionsError}
              </p>
            ) : null}
            {!sessionDeleteRetryAllowed ? (
              <div className="mt-4 rounded-md bg-surface-muted p-3">
                <p className="text-sm text-text-muted">
                  最新状態を確認するまで削除を再試行できません。
                </p>
                <Button
                  variant="secondary"
                  className="mt-3"
                  onClick={handleRetrySessionDeleteStatus}
                  disabled={isRefreshingSessionDelete}
                  loading={isRefreshingSessionDelete}
                >
                  状態を再取得
                </Button>
              </div>
            ) : null}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={handleCancelDeleteSession}
                disabled={
                  Boolean(deletingSessionId) || isRefreshingSessionDelete
                }
              >
                キャンセル
              </Button>
              <Button
                variant="danger"
                onClick={() => void handleConfirmDeleteSession()}
                disabled={
                  Boolean(deletingSessionId) ||
                  isRefreshingSessionDelete ||
                  !sessionDeleteRetryAllowed
                }
                loading={
                  Boolean(deletingSessionId) || isRefreshingSessionDelete
                }
              >
                削除する
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
};

export default SeasonPage;
