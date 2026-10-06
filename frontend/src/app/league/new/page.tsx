"use client";

import * as React from "react";

import {
  ArrowLeft,
  Search,
  Settings2,
  Trophy,
  Type,
  UsersRound,
} from "lucide-react";

import Link from "next/link";

import { LeagueRuleEditor } from "@/features/league/ui/league-rule-editor";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";

import { useLeagueNew } from "./hooks";

const NewLeaguePage: React.FC = () => {
  const {
    leagueName,
    creatorName,
    memberCount,
    memberQuery,
    addedMembers,
    memberCandidates,
    isSearchingMembers,
    isSubmitting,
    isAuthLoading,
    error,
    submitError,
    showUmaErrors,
    errorSummaryFocusToken,
    ruleSettings,
    handleLeagueNameChange,
    handleMemberQueryChange,
    handleAddMember,
    handleRemoveMember,
    handleGameTypeChange,
    handleOkaSettingChange,
    handleChomboPenaltyPointsChange,
    handleAllowOffTableKyotakuChange,
    handleRotateSeatOrderChange,
    handleModeChange,
    handleFixedUmaChange,
    handleFloatingCountUmaChange,
    handleSubmit,
  } = useLeagueNew();

  return (
    <AppShell mainClassName="min-h-screen bg-background font-jp">
      <div className="mx-auto flex w-full max-w-[390px] flex-col gap-4 px-4 pb-8 pt-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-200 text-white">
            <Trophy className="h-4 w-4" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-bold text-foreground">リーグ作成</h1>
        </div>

        <Card
          className="rounded-xl border-2 border-brand-200 shadow-none"
          bodyClassName="space-y-4 p-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="league-name"
              className="flex items-center gap-2 text-sm font-semibold text-foreground"
            >
              <Type className="h-4 w-4 text-slate-700" aria-hidden="true" />
              リーグ名
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="league-name"
                containerClassName="min-w-0 flex-1 space-y-0"
                className="h-9 rounded-lg px-3 shadow-none"
                placeholder="例: M"
                value={leagueName}
                onChange={handleLeagueNameChange}
                aria-describedby="league-name-suffix"
              />
              <span
                id="league-name-suffix"
                className="shrink-0 text-sm font-bold text-foreground"
              >
                リーグ
              </span>
            </div>
          </div>

          <section className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <UsersRound
                    className="h-4 w-4 text-slate-700"
                    aria-hidden="true"
                  />
                  メンバー追加
                </h2>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-200 px-4 py-1 text-xs font-semibold text-foreground">
                <UsersRound
                  className="h-4 w-4 text-brand-600"
                  aria-hidden="true"
                />
                {memberCount} 人
              </span>
            </div>

            <div className="flex flex-wrap gap-2" aria-label="追加済みメンバー">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-strong">
                {creatorName}
              </span>
              {Object.entries(addedMembers).map(([id, member]) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-strong"
                >
                  {member.name}
                  <button
                    type="button"
                    className="cursor-pointer font-bold"
                    onClick={() => handleRemoveMember(id)}
                    aria-label={`${member.name}を削除`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                aria-label="ユーザー名で検索"
                containerClassName="space-y-0"
                className="h-9 rounded-lg pl-9 shadow-none"
                value={memberQuery}
                onChange={handleMemberQueryChange}
                placeholder="ユーザー名で検索"
              />
            </div>

            {memberQuery.trim() ? (
              <div className="space-y-2 rounded-lg border border-border bg-surface-muted p-3">
                {isSearchingMembers ? (
                  <p className="text-xs text-text-muted">検索中です…</p>
                ) : memberCandidates.length > 0 ? (
                  memberCandidates.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between gap-3 rounded-lg bg-white p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {member.name}
                        </p>
                        <p className="text-xs text-text-muted">
                          @{member.username}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAddMember(member)}
                      >
                        追加
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-text-muted">
                    条件に一致するユーザーが見つかりません。
                  </p>
                )}
              </div>
            ) : null}
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Settings2
                className="h-4 w-4 text-slate-700"
                aria-hidden="true"
              />
              ルール設定
            </h2>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">モード</h3>
              <div className="flex gap-3">
                {(
                  [
                    { value: "yonma", label: "4麻" },
                    { value: "sanma", label: "3麻" },
                  ] as const
                ).map(({ value, label }) => (
                  <Button
                    key={value}
                    type="button"
                    variant="selection"
                    size="sm"
                    selected={ruleSettings.gameType === value}
                    onClick={() => handleGameTypeChange(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                オカ設定
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {(
                  [
                    ["okaStartPoints", "持ち点（点）", "例: 30000"],
                    ["okaReturnPoints", "返し点（点）", "例: 30000"],
                  ] as const
                ).map(([field, label, placeholder]) => (
                  <Input
                    key={field}
                    label={label}
                    containerClassName="space-y-1"
                    className="h-10 rounded-lg px-3 shadow-none"
                    type="number"
                    value={ruleSettings[field]}
                    onChange={(event) =>
                      handleOkaSettingChange(field, event.target.value)
                    }
                    placeholder={placeholder}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                ウマ設定
              </h3>
              <LeagueRuleEditor
                gameType={ruleSettings.gameType}
                mode={ruleSettings.mode}
                fixedUma={ruleSettings.fixedUma}
                floatingCountUma={ruleSettings.floatingCountUma}
                chomboPenaltyPoints={ruleSettings.chomboPenaltyPoints}
                allowOffTableKyotaku={ruleSettings.allowOffTableKyotaku}
                rotateSeatOrder={ruleSettings.rotateSeatOrder}
                showErrorSummary={showUmaErrors}
                submitError={submitError}
                errorSummaryFocusToken={errorSummaryFocusToken}
                disabled={isSubmitting}
                onModeChange={handleModeChange}
                onFixedUmaChange={handleFixedUmaChange}
                onFloatingCountUmaChange={handleFloatingCountUmaChange}
                onChomboPenaltyPointsChange={handleChomboPenaltyPointsChange}
                onAllowOffTableKyotakuChange={handleAllowOffTableKyotakuChange}
                onRotateSeatOrderChange={handleRotateSeatOrderChange}
              />
            </div>
          </section>

          {error ? <ErrorState message={error} /> : null}

          <div className="flex flex-col items-center gap-3 pt-1">
            <Button
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || isAuthLoading}
              size="lg"
              className="min-w-[144px] rounded-xl"
            >
              リーグを作成
            </Button>
            <Link
              href="/"
              className="inline-flex cursor-pointer items-center gap-1 text-sm text-text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              リーグ一覧へ戻る
            </Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
};

export default NewLeaguePage;
