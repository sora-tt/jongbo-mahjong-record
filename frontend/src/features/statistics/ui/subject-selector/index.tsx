"use client";
import * as React from "react";

import { UserRound, X } from "lucide-react";

import {
  getStatisticsSubjectSelectorModel,
  type StatisticsSubjectMember,
  type StatisticsSubjectMembersStatus,
} from "@/features/statistics/model/subject-selector";

import { Button } from "@/components/ui/button";
import { Control } from "@/components/ui/control";
import { Dialog } from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/error-state";
import { IconButton } from "@/components/ui/icon-button";
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
  onChangeTarget: (id: string) => void;
  retryMembers: () => void;
};
export const StatisticsSubjectSelector = ({
  scopeType,
  viewerUserId,
  targetUserId,
  userName,
  members,
  membersStatus,
  membersError,
  onChangeTarget,
  retryMembers,
}: Props) => {
  const [open, setOpen] = React.useState(false);
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();
  const radioName = React.useId();
  const model = getStatisticsSubjectSelectorModel({
    scopeType,
    viewerUserId,
    targetUserId,
    userName,
    members,
    membersStatus,
  });
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  if (!model.visible) return null;
  const viewerName = userName.trim() || "名前未設定";
  const options = model.candidateOptions.some(
    (member) => member.userId === viewerUserId
  )
    ? model.candidateOptions
    : [
        { userId: viewerUserId, userName: viewerName },
        ...model.candidateOptions,
      ];
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        disabled={membersStatus === "ready" && !model.canChangeTarget}
      >
        他の参加者
      </Button>
      <Dialog
        ref={dialogRef}
        className="w-full"
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 id={titleId} className="text-app-heading-2 font-bold">
            他の参加者
          </h2>
          <IconButton
            type="button"
            size="sm"
            variant="tertiary"
            className="!border-0 !text-app-text-secondary"
            aria-label="参加者選択を閉じる"
            onClick={() => dialogRef.current?.close()}
          >
            <X size={20} aria-hidden="true" />
          </IconButton>
        </div>
        <div className="mt-4 space-y-2">
          {model.isLoading && <LoadingState label="参加者を読み込んでいます" />}
          {model.membersError && (
            <ErrorState
              message={membersError ?? "参加者一覧を取得できませんでした。"}
              onRetry={retryMembers}
            />
          )}
          {membersStatus === "ready" && model.candidateOptions.length === 0 && (
            <p className="text-app-caption text-app-text-secondary">
              参加者候補がありません。
            </p>
          )}
          <fieldset aria-label="成績を表示する参加者" className="space-y-1">
            {options.map((member) => {
              const selected = member.userId === model.selectedUserId;
              const isViewer = member.userId === viewerUserId;
              const name = member.userName.trim() || "名前未設定";
              return (
                <div
                  key={member.userId}
                  className={`rounded-app-control px-3 ${selected ? "bg-app-brand-soft" : ""}`}
                >
                  <Control
                    type="radio"
                    name={radioName}
                    checked={selected}
                    label={
                      <span className="inline-flex items-center gap-1.5">
                        {name}さん
                        {isViewer && (
                          <UserRound
                            size={16}
                            role="img"
                            aria-label="本人"
                            className="text-app-text-secondary"
                          />
                        )}
                      </span>
                    }
                    className="flex w-full"
                    onChange={() => {
                      if (!selected) onChangeTarget(member.userId);
                      dialogRef.current?.close();
                    }}
                  />
                </div>
              );
            })}
          </fieldset>
        </div>
        <p className="mt-6 text-app-caption text-app-text-secondary">
          選択すると表示対象を切り替えます
        </p>
      </Dialog>
    </>
  );
};
