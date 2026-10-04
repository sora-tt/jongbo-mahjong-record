"use client";

import * as React from "react";

import {
  getStatisticsPagePanelState,
  getStatisticsPagePeriodLabel,
  getStatisticsPageScopeOptions,
  getStatisticsPageSubjectLabel,
  normalizeStatisticsPageQueryStatus,
} from "@/features/statistics/model/page";
import { MatchHistory } from "@/features/statistics/ui/MatchHistory";
import { PersonalRecords } from "@/features/statistics/ui/PersonalRecords";
import { ScoreBreakdown } from "@/features/statistics/ui/ScoreBreakdown";
import { StatisticsBreakdowns } from "@/features/statistics/ui/StatisticsBreakdowns";
import { StatisticsOverview } from "@/features/statistics/ui/StatisticsOverview";
import { StatisticsScopeFilter } from "@/features/statistics/ui/StatisticsScopeFilter";
import { StatisticsSubjectSelector } from "@/features/statistics/ui/StatisticsSubjectSelector";
import { StatisticsTrend } from "@/features/statistics/ui/StatisticsTrend";
import { StatisticsViewTabs } from "@/features/statistics/ui/StatisticsViewTabs";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

import { useStatistics } from "./hooks";

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

const getGameTypeLabel = (
  gameType: ReturnType<typeof useStatistics>["scope"]["gameType"]
) => {
  if (gameType === "sanma") return "三麻";
  if (gameType === "yonma") return "四麻";
  return "全ての形式";
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
  const periodLabel = getStatisticsPagePeriodLabel(statistics.scope);
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
          <ScoreBreakdown summary={summaryState.data} />
          <PersonalRecords summary={summaryState.data} />
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
            summary={statistics.summary}
            windowSize={statistics.windowSize}
            groupBy={statistics.groupBy}
            scopeLabel={scopeLabel}
            onChangeWindowSize={statistics.onChangeWindowSize}
          />
          <StatisticsBreakdowns
            analysis={analysisState.data}
            dimension={statistics.dimension}
            groupBy={statistics.groupBy}
            subjectLabel={subjectLabel}
            scopeLabel={scopeLabel}
            loadingMore={statistics.isLoadingMoreAnalysis}
            loadMoreError={statistics.analysisMoreError}
            onChangeDimension={statistics.onChangeDimension}
            onChangeGroupBy={statistics.onChangeGroupBy}
            onLoadMore={statistics.loadMoreAnalysis}
          />
        </>
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
          scopeLabel={scopeLabel}
          historyError={statistics.historyError}
          isLoadingMore={statistics.isLoadingMoreHistory}
          onLoadMore={() => void statistics.loadMoreHistory()}
          onRetry={statistics.retryHistory}
        />
      )}
    </section>
  );

  const pageContent = (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          {subjectLabel === "本人" || !subjectLabel
            ? "個人成績"
            : `${subjectLabel}さんの個人成績`}
        </h1>
        <p className="text-sm text-text-muted" aria-live="polite">
          表示対象: {subjectLabel} / 範囲: {scopeLabel} / 期間: {periodLabel} /
          形式: {getGameTypeLabel(statistics.scope.gameType)}
        </p>
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
        <>
          <StatisticsScopeFilter
            scope={statistics.scope}
            scopeOptions={scopeOptions}
            onChangeScope={statistics.onChangeScope}
            onChangeDateRange={statistics.onChangeDateRange}
            onChangeGameType={statistics.onChangeGameType}
          >
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
          </StatisticsScopeFilter>

          <StatisticsViewTabs
            activeView={statistics.activeView}
            onActiveViewChange={statistics.onChangeActiveView}
            panels={{
              overview: summaryPanel,
              analysis: analysisPanel,
              history: historyPanel,
            }}
          />
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

const StatisticsPage: React.FC = () => <StatisticsPageContent />;

export default StatisticsPage;
