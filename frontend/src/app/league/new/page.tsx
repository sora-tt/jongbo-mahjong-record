"use client";

import * as React from "react";

import Link from "next/link";

import { LeagueRuleEditor } from "@/features/league/ui/league-rule-editor";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

import { useLeagueNew } from "./hooks";

const NewLeaguePage: React.FC = () => {
  const {
    leagueName,
    memberQuery,
    addedMembers,
    memberCandidates,
    isSearchingMembers,
    isSubmitting,
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
    handleModeChange,
    handleFixedUmaChange,
    handleFloatingCountUmaChange,
    handleSubmit,
  } = useLeagueNew();

  return (
    <AppShell mainClassName="min-h-screen bg-background font-jp">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">リーグ作成</h1>
          <p className="mt-2 text-sm text-text-muted">
            参加者とルールを設定してリーグを作成します。
          </p>
        </div>

        <Card bodyClassName="space-y-6">
          <Input
            label="リーグ名"
            placeholder="例: Mリーグ"
            value={leagueName}
            onChange={handleLeagueNameChange}
            required
          />

          <section className="space-y-3">
            <div>
              <h2 className="font-semibold text-foreground">メンバー</h2>
              <p className="mt-1 text-xs text-text-muted">
                ユーザー名で検索して追加します。作成者本人はBE側で自動的に含まれます。
              </p>
            </div>
            <Input
              label="ユーザー検索"
              value={memberQuery}
              onChange={handleMemberQueryChange}
              placeholder="ユーザー名で検索"
            />
            {memberQuery.trim() ? (
              <div className="space-y-2 rounded-control border border-border bg-surface-muted p-3">
                {isSearchingMembers ? (
                  <p className="text-sm text-text-muted">検索中です…</p>
                ) : memberCandidates.length > 0 ? (
                  memberCandidates.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between gap-3 rounded-control bg-white p-3"
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
                  <p className="text-sm text-text-muted">
                    条件に一致するユーザーが見つかりません。
                  </p>
                )}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {Object.entries(addedMembers).map(([id, member]) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-strong"
                >
                  {member.name}
                  <button
                    type="button"
                    className="font-bold"
                    onClick={() => handleRemoveMember(id)}
                    aria-label={`${member.name}を削除`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-semibold text-foreground">ルール設定</h2>
            <Select
              label="ゲーム種別"
              value={ruleSettings.gameType}
              onChange={(event) =>
                handleGameTypeChange(event.target.value as "sanma" | "yonma")
              }
            >
              <option value="yonma">四麻</option>
              <option value="sanma">三麻</option>
            </Select>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="持ち点"
                type="number"
                value={ruleSettings.okaStartPoints}
                onChange={(event) =>
                  handleOkaSettingChange("okaStartPoints", event.target.value)
                }
                required
              />
              <Input
                label="返し点"
                type="number"
                value={ruleSettings.okaReturnPoints}
                onChange={(event) =>
                  handleOkaSettingChange("okaReturnPoints", event.target.value)
                }
                required
              />
            </div>
            <LeagueRuleEditor
              gameType={ruleSettings.gameType}
              mode={ruleSettings.mode}
              fixedUma={ruleSettings.fixedUma}
              floatingCountUma={ruleSettings.floatingCountUma}
              showErrorSummary={showUmaErrors}
              submitError={submitError}
              errorSummaryFocusToken={errorSummaryFocusToken}
              disabled={isSubmitting}
              onModeChange={handleModeChange}
              onFixedUmaChange={handleFixedUmaChange}
              onFloatingCountUmaChange={handleFloatingCountUmaChange}
            />
          </section>

          {error ? <ErrorState message={error} /> : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              リーグを作成
            </Button>
            <Link
              href="/"
              className="text-sm text-text-muted underline-offset-4 hover:text-foreground hover:underline"
            >
              キャンセル
            </Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
};

export default NewLeaguePage;
