"use client";

import * as React from "react";

import { Users, X } from "lucide-react";

import {
  getStatisticsSubjectSelectorModel,
  type StatisticsSubjectMember,
  type StatisticsSubjectMembersStatus,
} from "@/features/statistics/model/subject-selector";

import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

import type { StatisticsScopeFilters } from "@/features/statistics/model/query-cache";

type Props = {
  scopeType: StatisticsScopeFilters["scopeType"];
  viewerUserId: string;
  targetUserId: string;
  userName: string;
  members: readonly StatisticsSubjectMember[];
  membersStatus: StatisticsSubjectMembersStatus;
  membersError: string | null;
  onChangeTarget: (targetUserId: string) => void;
  retryMembers: () => void;
};

export const StatisticsSubjectSelector: React.FC<Props> = ({
  scopeType,
  viewerUserId,
  targetUserId,
  userName,
  members,
  membersStatus,
  membersError,
  onChangeTarget,
  retryMembers,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const panelId = React.useId();
  const model = getStatisticsSubjectSelectorModel({
    scopeType,
    viewerUserId,
    targetUserId,
    userName,
    members,
    membersStatus,
  });

  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  if (!model.visible) return null;

  const viewerOptionLabel = userName ? `${userName}さん（本人）` : "本人";
  const options = model.candidateOptions.some(
    (member) => member.userId === viewerUserId
  )
    ? model.candidateOptions
    : [
        { userId: viewerUserId, userName: viewerOptionLabel },
        ...model.candidateOptions,
      ];
  const disabled = membersStatus === "ready" && !model.canChangeTarget;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        disabled={disabled}
        onClick={() => setIsOpen((previous) => !previous)}
        className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border bg-white px-3 text-sm font-medium text-brand-strong transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Users className="h-4 w-4" aria-hidden="true" />
        他の参加者
      </button>

      {isOpen ? (
        <section
          id={panelId}
          aria-labelledby={`${panelId}-title`}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-surface border border-border bg-white text-foreground shadow-xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <h2
                id={`${panelId}-title`}
                className="font-semibold text-foreground"
              >
                成績を見る参加者
              </h2>
              <p className="mt-1 text-xs text-text-muted">
                現在: {model.selectedUserName}
                {model.isViewingSelf ? "（本人）" : "さん"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="参加者選択を閉じる"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-text-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="max-h-[min(60dvh,28rem)] space-y-3 overflow-y-auto p-4">
            {model.isLoading ? (
              <LoadingState label="参加者を読み込んでいます…" />
            ) : null}
            {model.membersError ? (
              <ErrorState
                message={
                  membersError ??
                  "参加者一覧を取得できませんでした。本人の成績を表示しています。"
                }
                onRetry={retryMembers}
              />
            ) : null}
            {membersStatus === "ready" &&
            model.candidateOptions.length === 0 ? (
              <p className="text-sm text-text-muted" role="status">
                参加者候補がありません。
              </p>
            ) : null}

            <ul className="space-y-2" aria-label="成績を表示する参加者">
              {options.map((member) => {
                const isSelected = member.userId === model.selectedUserId;
                const name =
                  member.userId === viewerUserId
                    ? viewerOptionLabel
                    : `${member.userName}さん`;
                return (
                  <li key={member.userId}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        if (!isSelected) onChangeTarget(member.userId);
                        setIsOpen(false);
                      }}
                      className={`flex min-h-12 w-full items-center justify-between rounded-control border px-4 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${isSelected ? "border-brand-300 bg-brand-50 font-semibold text-brand-strong" : "border-border bg-white text-foreground hover:bg-surface-muted"}`}
                    >
                      <span>{name}</span>
                      {isSelected ? (
                        <span className="text-xs">表示中</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
};
