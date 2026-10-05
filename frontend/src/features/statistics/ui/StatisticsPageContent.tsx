"use client";

import * as React from "react";

import Link from "next/link";

import { useStatistics } from "@/app/stats/hooks";
import {
  getStatisticsPagePanelState,
  getStatisticsPageScopeOptions,
  getStatisticsPageSubjectLabel,
  normalizeStatisticsPageQueryStatus,
} from "@/features/statistics/model/page";
import { MatchHistory } from "@/features/statistics/ui/MatchHistory";
import { PersonalRecords } from "@/features/statistics/ui/PersonalRecords";
import { ScoreBreakdown } from "@/features/statistics/ui/ScoreBreakdown";
import { StatisticsComparisons } from "@/features/statistics/ui/StatisticsComparisons";
import { StatisticsHub } from "@/features/statistics/ui/StatisticsHub";
import { StatisticsOverview } from "@/features/statistics/ui/StatisticsOverview";
import { StatisticsSubjectSelector } from "@/features/statistics/ui/StatisticsSubjectSelector";
import { StatisticsTrend } from "@/features/statistics/ui/StatisticsTrend";
import { StatisticsViewTabs } from "@/features/statistics/ui/StatisticsViewTabs";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

const getScopeLabel = (
  scope: ReturnType<typeof useStatistics>["scope"],
  scopeOptions: ReturnType<typeof getStatisticsPageScopeOptions>
) => {
  if (scope.scopeType === "overall") return "全体";
  if (scope.scopeType === "league") {
    return (
      scopeOptions.find((option) => option.leagueId === scope.leagueId)
        ?.leagueName ?? "選択中のリーグ"
    );
  }

  return (
    scopeOptions.find(
      (option) =>
        option.leagueId === scope.leagueId && option.seasonId === scope.seasonId
    )?.seasonName ?? "選択中のシーズン"
  );
};

type StatisticsPageContentProps = {
  useStatisticsHook?: typeof useStatistics;
  includeAppShell?: boolean;
};

export const StatisticsPageContent: React.FC<StatisticsPageContentProps> = ({
  useStatisticsHook = useStatistics,
  includeAppShell = true,
}) => {
  const statistics = useStatisticsHook();
  const startingPointsByLeagueId = statistics.startingPointsByLeagueId;
  const currentLeagueStartingPoints =
    statistics.scope.scopeType === "overall" || !statistics.scope.leagueId
      ? null
      : (startingPointsByLeagueId[String(statistics.scope.leagueId)] ?? null);
  const scopeOptions = React.useMemo(
    () => getStatisticsPageScopeOptions(statistics.joiningLeagueSeasons),
    [statistics.joiningLeagueSeasons]
  );
  const subjectLabel = getStatisticsPageSubjectLabel({
    viewerUserId: statistics.viewerUserId,
    targetUserId: statistics.targetUserId,
    viewerName: statistics.userName,
    members: statistics.members,
  });
  const scopeLabel = getScopeLabel(statistics.scope, scopeOptions);
  const titleScopeLabel =
    statistics.routeContext.scopeLabel ||
    (statistics.scope.scopeType === "overall"
      ? statistics.scope.gameType === "sanma"
        ? "全リーグ・全期間（三麻）"
        : statistics.scope.gameType === "yonma"
          ? "全リーグ・全期間（四麻）"
          : "全体・全期間"
      : scopeLabel === "選択中のリーグ"
        ? "リーグ成績"
        : scopeLabel === "選択中のシーズン"
          ? "シーズン成績"
          : scopeLabel);
  const summaryState = getStatisticsPagePanelState(
    statistics.summaryStatus,
    statistics.summary,
    statistics.summaryError
  );
  const analysisState = getStatisticsPagePanelState(
    statistics.analysisStatus,
    statistics.analysis,
    statistics.analysisError
  );

  const summaryPanel = (
    <section
      aria-labelledby="statistics-overview-panel-heading"
      className="space-y-4"
    >
      <h2 id="statistics-overview-panel-heading" className="sr-only">
        成績の概要
      </h2>
      {statistics.initialError ? (
        <ErrorState
          message={statistics.initialError}
          onRetry={statistics.retry}
        />
      ) : statistics.isLoading ? (
        <LoadingState
          label="個人成績を読み込んでいます…"
          className="min-h-40"
        />
      ) : summaryState.kind === "idle" ? (
        <p
          className="rounded-control border border-border bg-surface-muted p-4 text-sm text-text-muted"
          role="status"
        >
          表示対象の成績を準備しています。
        </p>
      ) : summaryState.kind === "loading" ? (
        <LoadingState
          label="概要の成績を読み込んでいます…"
          className="min-h-40"
        />
      ) : summaryState.kind === "error" ? (
        <ErrorState
          message={summaryState.message}
          onRetry={statistics.retrySummary}
        />
      ) : summaryState.kind === "uncomputed" ? (
        <EmptyState
          title="統計がまだ計算されていません"
          description="対象範囲の成績集計が完了すると、概要を表示します。"
        />
      ) : summaryState.kind === "empty" ? (
        <EmptyState
          title="対局結果がありません"
          description="選択した対象範囲に登録済みの対局結果はありません。"
        />
      ) : summaryState.data.status === "uncomputed" ? (
        <EmptyState
          title="統計がまだ計算されていません"
          description="対象範囲の成績集計が完了すると、概要を表示します。"
        />
      ) : (
        <>
          <StatisticsOverview summary={summaryState.data} />
          <details className="rounded-surface border border-border bg-white">
            <summary className="min-h-12 cursor-pointer px-4 py-3 font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
              スコア詳細
            </summary>
            <div className="border-t border-border p-4">
              <ScoreBreakdown
                summary={summaryState.data}
                startingPoints={currentLeagueStartingPoints}
              />
            </div>
          </details>
          <PersonalRecords
            summary={summaryState.data}
            startingPointsByLeagueId={startingPointsByLeagueId}
          />
        </>
      )}
    </section>
  );

  const analysisPanel = (
    <section
      aria-labelledby="statistics-analysis-panel-heading"
      className="space-y-4"
    >
      <h2 id="statistics-analysis-panel-heading" className="sr-only">
        成績分析
      </h2>
      {statistics.initialError ? (
        <ErrorState
          message={statistics.initialError}
          onRetry={statistics.retry}
        />
      ) : statistics.isLoading ? (
        <LoadingState label="分析の準備をしています…" className="min-h-40" />
      ) : analysisState.kind === "idle" ? (
        <p
          className="rounded-control border border-border bg-surface-muted p-4 text-sm text-text-muted"
          role="status"
        >
          表示対象の分析を準備しています。
        </p>
      ) : analysisState.kind === "loading" ? (
        <LoadingState
          label="成績分析を読み込んでいます…"
          className="min-h-40"
        />
      ) : analysisState.kind === "error" ? (
        <ErrorState
          message={analysisState.message}
          onRetry={statistics.retryAnalysis}
        />
      ) : analysisState.kind === "uncomputed" ? (
        <EmptyState
          title="統計がまだ計算されていません"
          description="対象範囲の成績集計が完了すると、推移や条件別成績を表示します。"
        />
      ) : analysisState.kind === "empty" ? (
        <EmptyState
          title="分析できる対局結果がありません"
          description="選択した対象範囲に登録済みの対局結果はありません。"
        />
      ) : analysisState.data.status === "uncomputed" ? (
        <EmptyState
          title="統計がまだ計算されていません"
          description="対象範囲の成績集計が完了すると、推移や条件別成績を表示します。"
        />
      ) : (
        <>
          <StatisticsTrend
            analysis={analysisState.data}
            scopeLabel={titleScopeLabel}
          />
        </>
      )}
    </section>
  );

  const comparisonsPanel = (
    <section
      aria-labelledby="statistics-comparisons-panel-heading"
      className="space-y-4"
    >
      <h2 id="statistics-comparisons-panel-heading" className="sr-only">
        相手・席別成績
      </h2>
      {statistics.initialError ? (
        <ErrorState
          message={statistics.initialError}
          onRetry={statistics.retry}
        />
      ) : statistics.isLoading ? (
        <LoadingState
          label="相手・席別成績の準備をしています…"
          className="min-h-40"
        />
      ) : analysisState.kind === "loading" || analysisState.kind === "idle" ? (
        <LoadingState
          label="相手・席別成績を読み込んでいます…"
          className="min-h-40"
        />
      ) : analysisState.kind === "error" ? (
        <ErrorState
          message={analysisState.message}
          onRetry={statistics.retryAnalysis}
        />
      ) : analysisState.kind === "uncomputed" ||
        analysisState.kind === "empty" ? (
        <EmptyState
          title={
            analysisState.kind === "empty"
              ? "対局結果がありません"
              : "統計がまだ計算されていません"
          }
          description="対象範囲の成績が集計されると、席別・相手別の成績を表示します。"
        />
      ) : analysisState.data.status === "uncomputed" ? (
        <EmptyState
          title="統計がまだ計算されていません"
          description="対象範囲の成績が集計されると、席別・相手別の成績を表示します。"
        />
      ) : statistics.additionalAnalysisStatus === "loading" ? (
        <LoadingState
          label="席別成績を読み込んでいます…"
          className="min-h-40"
        />
      ) : statistics.additionalAnalysisStatus === "error" ? (
        <ErrorState
          message={
            statistics.additionalAnalysisError ??
            "席別成績を取得できませんでした。"
          }
          onRetry={statistics.retryAnalysis}
        />
      ) : (
        <StatisticsComparisons
          opponentAnalysis={analysisState.data}
          seatAnalysis={statistics.additionalAnalyses.seat ?? null}
          subjectLabel={subjectLabel}
          scopeLabel={titleScopeLabel}
          isLoadingMore={statistics.isLoadingMoreAnalysis}
          loadMoreError={statistics.analysisMoreError}
          onLoadMore={statistics.loadMoreAnalysis}
        />
      )}
    </section>
  );

  const historyPanel = (
    <section
      aria-labelledby="statistics-history-panel-heading"
      className="space-y-4"
    >
      <h2 id="statistics-history-panel-heading" className="sr-only">
        対局履歴
      </h2>
      {statistics.initialError ? (
        <ErrorState
          message={statistics.initialError}
          onRetry={statistics.retry}
        />
      ) : statistics.isLoading ? (
        <LoadingState
          label="対局履歴の準備をしています…"
          className="min-h-40"
        />
      ) : (
        <MatchHistory
          history={statistics.history}
          status={normalizeStatisticsPageQueryStatus(statistics.historyStatus)}
          subjectLabel={subjectLabel}
          scopeLabel={titleScopeLabel}
          startingPointsByLeagueId={startingPointsByLeagueId}
          historyError={statistics.historyError}
          isLoadingMore={statistics.isLoadingMoreHistory}
          onLoadMore={() => void statistics.loadMoreHistory()}
          onRetry={statistics.retryHistory}
        />
      )}
    </section>
  );

  const pageContent = (
    <div className="mx-auto flex max-w-md flex-col gap-5 px-4 py-6">
      {!statistics.isContextMode ? (
        statistics.initialError ? (
          <ErrorState
            message={statistics.initialError}
            onRetry={statistics.retry}
          />
        ) : statistics.isLoading ? (
          <LoadingState label="成績を準備しています…" className="min-h-40" />
        ) : (
          <StatisticsHub
            viewerUserId={statistics.viewerUserId}
            seasons={statistics.joiningLeagueSeasons}
            leagues={statistics.joiningLeagues}
            status={statistics.hubDataStatus}
            onRetry={statistics.retry}
          />
        )
      ) : (
        <>
          <header className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <h1 className="text-2xl font-bold text-foreground">
                  {subjectLabel === "本人" || !subjectLabel
                    ? "個人成績"
                    : `${subjectLabel}さんの成績`}
                </h1>
                <p className="text-sm text-text-muted" aria-live="polite">
                  {titleScopeLabel}
                </p>
              </div>
              <StatisticsSubjectSelector
                scopeType={statistics.scope.scopeType}
                viewerUserId={statistics.viewerUserId}
                targetUserId={statistics.targetUserId}
                userName={statistics.userName}
                members={statistics.members}
                membersStatus={statistics.membersStatus}
                membersError={statistics.membersError}
                onChangeTarget={statistics.onChangeTarget}
                retryMembers={statistics.retryMembers}
              />
            </div>
            {statistics.routeContext.returnTo ? (
              <Link
                href={statistics.routeContext.returnTo}
                className="inline-flex min-h-11 items-center text-sm font-medium text-brand-strong underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                {statistics.routeContext.returnTo.includes("/season/")
                  ? "順位表に戻る"
                  : statistics.routeContext.returnTo === "/"
                    ? "ホームに戻る"
                    : statistics.routeContext.returnTo === "/stats"
                      ? "成績一覧に戻る"
                      : "リーグに戻る"}
              </Link>
            ) : null}
          </header>

          {statistics.initialError ? (
            <ErrorState
              message={statistics.initialError}
              onRetry={statistics.retry}
            />
          ) : statistics.isLoading ? (
            <LoadingState
              label="表示条件を読み込んでいます…"
              className="min-h-32"
            />
          ) : (
            <StatisticsViewTabs
              activeView={statistics.activeView}
              onActiveViewChange={statistics.onChangeActiveView}
              panels={{
                overview: summaryPanel,
                trend: analysisPanel,
                comparisons: comparisonsPanel,
                history: historyPanel,
              }}
            />
          )}
        </>
      )}
    </div>
  );

  return includeAppShell ? (
    <AppShell mainClassName="min-h-screen bg-background font-jp">
      {pageContent}
    </AppShell>
  ) : (
    pageContent
  );
};
