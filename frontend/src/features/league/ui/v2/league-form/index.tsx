"use client";

import * as React from "react";

import { Search, X } from "lucide-react";

import Link from "next/link";

import { LeagueRuleEditor } from "@/features/league/ui/v2/league-rule-editor";

import { Button } from "@/components/v2/ui/button";
import { Chip } from "@/components/v2/ui/chip";
import { IconButton } from "@/components/v2/ui/icon-button";
import { Input } from "@/components/v2/ui/input";
import { LoadingState } from "@/components/v2/ui/loading-state";
import { Panel } from "@/components/v2/ui/panel";
import { Status } from "@/components/v2/ui/status";

import type { useLeagueNew } from "@/features/league/hooks/use-league-new";

type FormState = Omit<
  ReturnType<typeof useLeagueNew>,
  "creatorName" | "memberCount" | "isAuthLoading"
>;
type Props = {
  state: FormState;
  title?: string;
  creatorName?: string;
  ruleLocked?: boolean;
  disabled?: boolean;
  backHref: string;
  submitLabel: string;
  showBackLink?: boolean;
  footerAction?: React.ReactNode;
};
export const LeagueForm = ({
  state,
  title,
  creatorName,
  ruleLocked = false,
  disabled = false,
  backHref,
  submitLabel,
  showBackLink = true,
  footerAction,
}: Props) => {
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
    handleChomboPenaltyPointsChange,
    handleAllowOffTableKyotakuChange,
    handleRotateSeatOrderChange,
    handleModeChange,
    handleFixedUmaChange,
    handleFloatingCountUmaChange,
    handleSubmit,
  } = state;
  return (
    <div className="mx-auto flex max-w-[480px] flex-col gap-4 px-4 pb-10 pt-5">
      {title && (
        <h1 className="mb-1 text-center text-v2-display font-bold">{title}</h1>
      )}
      <Panel>
        <div className="flex items-end gap-3">
          <Input
            label="リーグ名"
            id="league-name"
            containerClassName="min-w-0 flex-1"
            value={leagueName}
            onChange={handleLeagueNameChange}
            placeholder="例: M"
            aria-describedby="league-name-suffix"
          />
          <span
            id="league-name-suffix"
            className="pb-3 text-v2-label font-semibold"
          >
            リーグ
          </span>
        </div>
      </Panel>
      <Panel className="space-y-3">
        <h2 className="text-v2-heading-2 font-bold">メンバー追加</h2>
        <div className="flex flex-wrap gap-2" aria-label="追加済みメンバー">
          {creatorName && (
            <Chip
              variant="selected"
              className="!border-transparent !font-normal"
            >
              {creatorName}（主催）
            </Chip>
          )}
          {Object.entries(addedMembers).map(([id, member]) => (
            <Chip
              key={id}
              className="gap-2 !border-transparent !font-normal !text-v2-text"
            >
              {member.name}
              <IconButton
                type="button"
                variant="tertiary"
                size="sm"
                onClick={() => handleRemoveMember(id)}
                aria-label={`${member.name}を削除`}
                className="!size-8 !border-0 !text-v2-text"
              >
                <X size={16} aria-hidden="true" />
              </IconButton>
            </Chip>
          ))}
        </div>
        <div className="relative">
          <Search
            aria-hidden="true"
            size={18}
            className="pointer-events-none absolute bottom-[13px] left-3 text-v2-text-secondary"
          />
          <Input
            label="ユーザー名で検索"
            aria-label="ユーザー名で検索"
            className="!pl-10"
            placeholder="ユーザー名で検索"
            value={memberQuery}
            onChange={handleMemberQueryChange}
          />
        </div>
        {memberQuery.trim() && (
          <div className="space-y-2 rounded-v2-control bg-v2-surface-subtle p-3">
            {isSearchingMembers ? (
              <LoadingState
                inline
                label="検索中です…"
                className="!text-v2-caption"
              />
            ) : memberCandidates.length ? (
              memberCandidates.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between gap-3 rounded-v2-control bg-v2-surface p-3"
                >
                  <div>
                    <p className="text-v2-label">{member.name}</p>
                    <p className="text-v2-caption text-v2-text-secondary">
                      @{member.username}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => handleAddMember(member)}
                  >
                    追加
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-v2-caption">
                条件に一致するユーザーが見つかりません。
              </p>
            )}
          </div>
        )}
      </Panel>
      <Panel className="space-y-4">
        <h2 className="text-v2-heading-2 font-bold">ルール設定</h2>
        {ruleLocked && (
          <p className="text-v2-caption text-v2-text-secondary">
            対局が記録されているため、ルールは変更できません。
          </p>
        )}
        <div className="space-y-2">
          <p className="text-v2-caption text-v2-text-secondary">モード</p>
          <div className="flex gap-2">
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
                disabled={ruleLocked}
                onClick={() => handleGameTypeChange(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-v2-caption text-v2-text-secondary">オカ設定</p>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["okaStartPoints", "持ち点"],
                ["okaReturnPoints", "返し点"],
              ] as const
            ).map(([field, label]) => (
              <Input
                key={field}
                label={label}
                type="number"
                value={ruleSettings[field]}
                disabled={ruleLocked}
                onChange={(event) =>
                  handleOkaSettingChange(field, event.target.value)
                }
              />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-v2-caption text-v2-text-secondary">ウマ設定</p>
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
            disabled={ruleLocked || isSubmitting}
            onModeChange={handleModeChange}
            onFixedUmaChange={handleFixedUmaChange}
            onFloatingCountUmaChange={handleFloatingCountUmaChange}
            onChomboPenaltyPointsChange={handleChomboPenaltyPointsChange}
            onAllowOffTableKyotakuChange={handleAllowOffTableKyotakuChange}
            onRotateSeatOrderChange={handleRotateSeatOrderChange}
          />
        </div>
      </Panel>
      {error && <Status message={error} />}
      <div className="flex flex-col items-center gap-4 px-6 pt-2">
        <Button
          type="button"
          size="lg"
          fullWidth
          loading={isSubmitting}
          disabled={disabled || isSubmitting}
          onClick={handleSubmit}
        >
          {submitLabel}
        </Button>
        {showBackLink && (
          <Link
            href={backHref}
            className="text-v2-label font-normal text-v2-text-secondary"
          >
            ← 戻る
          </Link>
        )}
        {footerAction && <div className="mt-4 w-full">{footerAction}</div>}
      </div>
    </div>
  );
};
