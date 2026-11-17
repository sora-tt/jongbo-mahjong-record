"use client";

import * as React from "react";

import { ChevronRight } from "lucide-react";

import Link from "next/link";

import { useStatistics } from "@/features/statistics/hooks/use-statistics";
import {
  buildStatisticsHref,
  getStatisticsPagePanelState,
  getStatisticsPageScopeOptions,
  getStatisticsPageSubjectLabel,
  normalizeStatisticsPageQueryStatus,
} from "@/features/statistics/model/page";
import { StatisticsComparisons } from "@/features/statistics/ui/v2/comparisons";
import { StatisticsHub } from "@/features/statistics/ui/v2/hub";
import { MatchHistory } from "@/features/statistics/ui/v2/match-history";
import { StatisticsOverview } from "@/features/statistics/ui/v2/overview";
import { ScoreBreakdown } from "@/features/statistics/ui/v2/score-breakdown";
import { StatisticsSubjectSelector } from "@/features/statistics/ui/v2/subject-selector";
import { StatisticsTrend } from "@/features/statistics/ui/v2/trend";
import { StatisticsViewTabs } from "@/features/statistics/ui/v2/view-tabs";

import { AppShell } from "@/components/v2/layout/app-shell";
import { EmptyState } from "@/components/v2/ui/empty-state";
import { ErrorState } from "@/components/v2/ui/error-state";
import { LoadingState } from "@/components/v2/ui/loading-state";
import { PageLoading } from "@/components/v2/ui/page-loading";
import { Panel } from "@/components/v2/ui/panel";
import {
  SlidingSegmentedControl,
  SlidingSegmentedControlButton,
} from "@/components/v2/ui/sliding-segmented-control";

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
  const statistics = useStatisticsHook("/v2", "v2");
  const isOverall = statistics.scope.scopeType === "overall";
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
          className="rounded-v2-control bg-v2-surface p-4 text-v2-caption text-v2-text-secondary"
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
          <StatisticsOverview
            summary={summaryState.data}
            startingPoints={currentLeagueStartingPoints}
            startingPointsByLeagueId={startingPointsByLeagueId}
            overall={isOverall}
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
          className="rounded-v2-control bg-v2-surface p-4 text-v2-caption text-v2-text-secondary"
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
        成績分析
      </h2>
      {!statistics.initialError && summaryState.kind === "error" ? (
        <ErrorState
          message={summaryState.message}
          onRetry={statistics.retrySummary}
        />
      ) : !statistics.initialError && summaryState.kind === "loading" ? (
        <LoadingState label="スコア分析を読み込んでいます…" />
      ) : summaryState.kind === "ready" &&
        summaryState.data.status !== "uncomputed" ? (
        <ScoreBreakdown summary={summaryState.data} />
      ) : null}
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

  const pageContent =
    statistics.isLoading && !statistics.initialError ? (
      <PageLoading label="成績を読み込んでいます" bottomNav />
    ) : (
      <div className="mx-auto flex max-w-[430px] flex-col gap-5 px-4 pb-28 pt-6">
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
            {isOverall ? (
              <>
                <header className="space-y-4">
                  <h1 className="text-center text-v2-display font-bold">
                    成績
                  </h1>
                  {statistics.scope.gameType !== "all" && (
                    <div className="flex min-h-11 items-center justify-between gap-3">
                      <p
                        className="text-v2-caption text-v2-text-secondary"
                        aria-live="polite"
                      >
                        {statistics.scope.gameType === "sanma"
                          ? "三麻"
                          : "四麻"}
                        ・全期間
                      </p>
                      <SlidingSegmentedControl
                        role="group"
                        label="対局形式"
                        selectedIndex={
                          statistics.scope.gameType === "sanma" ? 1 : 0
                        }
                        count={2}
                      >
                        {(
                          [
                            ["yonma", "四麻"],
                            ["sanma", "三麻"],
                          ] as const
                        ).map(([gameType, label]) => (
                          <SlidingSegmentedControlButton
                            key={gameType}
                            size="sm"
                            selected={statistics.scope.gameType === gameType}
                            onClick={() =>
                              statistics.onChangeGameType(gameType)
                            }
                          >
                            {label}
                          </SlidingSegmentedControlButton>
                        ))}
                      </SlidingSegmentedControl>
                    </div>
                  )}
                </header>
                {statistics.scope.gameType === "all" ? (
                  <Panel>
                    <h2 className="text-v2-heading-2 font-bold">
                      集計する対局を選択
                    </h2>
                    {(
                      [
                        ["yonma", "四麻"],
                        ["sanma", "三麻"],
                      ] as const
                    ).map(([gameType, label]) => (
                      <Link
                        key={gameType}
                        href={buildStatisticsHref({
                          routePrefix: "/v2",
                          scope: { scopeType: "overall", gameType },
                          targetUserId: statistics.viewerUserId,
                          scopeLabel: `全リーグ・全期間（${label}）`,
                          returnTo: "/v2/stats",
                        })}
                        className="flex min-h-14 items-center justify-between border-b border-v2-border-subtle font-bold last:border-0"
                      >
                        {label}の成績
                        <ChevronRight size={20} aria-hidden="true" />
                      </Link>
                    ))}
                  </Panel>
                ) : (
                  summaryPanel
                )}
              </>
            ) : (
              <>
                <header className="space-y-3">
                  <h1 className="text-center text-v2-display font-bold">
                    {statistics.targetUserId === statistics.viewerUserId ||
                    !subjectLabel
                      ? "個人成績"
                      : `${subjectLabel}さんの成績`}
                  </h1>
                  <div className="flex min-h-11 items-center justify-between gap-3">
                    <p
                      className="min-w-0 text-v2-caption text-v2-text-secondary"
                      aria-live="polite"
                    >
                      {titleScopeLabel}
                    </p>
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
          </>
        )}
      </div>
    );

  return includeAppShell ? (
    <AppShell bottomNav activeNav="statistics">
      {pageContent}
    </AppShell>
  ) : (
    pageContent
  );
};
