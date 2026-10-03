import * as React from "react";

import {
  getStatisticsDateRangeFromInput,
  getStatisticsDateRangeInputValues,
  getStatisticsLeagueOptions,
  getStatisticsSeasonOptionValue,
  getStatisticsSeasonOptions,
  selectStatisticsFilterLeague,
  selectStatisticsFilterScopeType,
  selectStatisticsFilterSeason,
  type StatisticsScopeOption,
} from "@/features/statistics/model/scope-filter";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

import type { StatisticsScopeFilters } from "@/features/statistics/model/query-cache";

type Props = {
  scope: StatisticsScopeFilters;
  scopeOptions: readonly StatisticsScopeOption[];
  children?: React.ReactNode;
  onChangeScope: (scope: StatisticsScopeFilters) => void;
  onChangeDateRange: (from?: string, to?: string) => void;
  onChangeGameType: (gameType: StatisticsScopeFilters["gameType"]) => void;
};

const gameTypeOptions = [
  { value: "all", label: "全て" },
  { value: "sanma", label: "三麻" },
  { value: "yonma", label: "四麻" },
] as const;

export const StatisticsScopeFilter: React.FC<Props> = ({
  scope,
  scopeOptions,
  children,
  onChangeScope,
  onChangeDateRange,
  onChangeGameType,
}) => {
  const leagueOptions = getStatisticsLeagueOptions(scopeOptions);
  const seasonOptions = getStatisticsSeasonOptions(scopeOptions);
  const dateRange = getStatisticsDateRangeInputValues(scope);
  const selectedSeason = seasonOptions.find(
    (option) =>
      option.leagueId === scope.leagueId && option.seasonId === scope.seasonId
  );

  const handleScopeTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const nextScope = selectStatisticsFilterScopeType(
      scope,
      event.target.value as StatisticsScopeFilters["scopeType"],
      scopeOptions
    );
    if (nextScope) onChangeScope(nextScope);
  };

  const handleLeagueChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextScope = selectStatisticsFilterLeague(
      scope,
      event.target.value,
      scopeOptions
    );
    if (nextScope) onChangeScope(nextScope);
  };

  const handleSeasonChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextScope = selectStatisticsFilterSeason(
      scope,
      event.target.value,
      scopeOptions
    );
    if (nextScope) onChangeScope(nextScope);
  };

  const handleDateRangeChange = (
    boundary: "from" | "through",
    value: string
  ) => {
    const fromDate = boundary === "from" ? value : dateRange.from;
    const throughDate = boundary === "through" ? value : dateRange.to;
    const nextRange = getStatisticsDateRangeFromInput(fromDate, throughDate);

    if (nextRange) onChangeDateRange(nextRange.from, nextRange.to);
  };

  return (
    <Card title="成績の絞り込み">
      <div className="space-y-4">
        <Select
          label="集計範囲"
          aria-label="集計範囲"
          value={scope.scopeType}
          onChange={handleScopeTypeChange}
          className="min-h-11 focus-visible:ring-2 focus-visible:ring-focus"
        >
          <option value="overall">全体</option>
          <option value="league" disabled={leagueOptions.length === 0}>
            リーグ
          </option>
          <option value="season" disabled={seasonOptions.length === 0}>
            シーズン
          </option>
        </Select>

        {scope.scopeType === "league" ? (
          <Select
            label="リーグ"
            aria-label="リーグ"
            value={scope.leagueId ?? ""}
            onChange={handleLeagueChange}
            className="min-h-11 focus-visible:ring-2 focus-visible:ring-focus"
          >
            {leagueOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </Select>
        ) : null}

        {scope.scopeType === "season" ? (
          <Select
            label="シーズン"
            aria-label="シーズン"
            value={
              selectedSeason
                ? getStatisticsSeasonOptionValue(selectedSeason)
                : ""
            }
            onChange={handleSeasonChange}
            className="min-h-11 focus-visible:ring-2 focus-visible:ring-focus"
          >
            {seasonOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.leagueName} - {option.seasonName}
              </option>
            ))}
          </Select>
        ) : null}

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">期間</legend>
          <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
            <Input
              type="date"
              label="開始日"
              aria-describedby="statistics-date-range-description"
              value={dateRange.from}
              max={dateRange.to || undefined}
              containerClassName="min-w-0"
              onChange={(event) =>
                handleDateRangeChange("from", event.target.value)
              }
              className="min-h-11 focus-visible:ring-2 focus-visible:ring-focus"
            />
            <Input
              type="date"
              label="終了日（含む）"
              aria-describedby="statistics-date-range-description"
              value={dateRange.to}
              min={dateRange.from || undefined}
              containerClassName="min-w-0"
              onChange={(event) =>
                handleDateRangeChange("through", event.target.value)
              }
              className="min-h-11 focus-visible:ring-2 focus-visible:ring-focus"
            />
          </div>
          <p
            id="statistics-date-range-description"
            className="text-xs text-text-muted"
          >
            日付未指定は全期間です。開始日を含み、終了日の翌日（日本時間）までを集計します。
          </p>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">
            ゲーム形式
          </legend>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="ゲーム形式"
          >
            {gameTypeOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant="secondary"
                size="md"
                selected={scope.gameType === option.value}
                onClick={() => onChangeGameType(option.value)}
                className="min-h-11 min-w-[5.25rem] flex-1"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </fieldset>
        {children}
      </div>
    </Card>
  );
};
