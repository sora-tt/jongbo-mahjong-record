import * as React from "react";

import {
  getStatisticsSubjectSelectorModel,
  type StatisticsSubjectMember,
  type StatisticsSubjectMembersStatus,
} from "@/features/statistics/model/subject-selector";

import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Select } from "@/components/ui/select";

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
  const model = getStatisticsSubjectSelectorModel({
    scopeType,
    viewerUserId,
    targetUserId,
    userName,
    members,
    membersStatus,
  });

  if (!model.visible) return null;

  const hasViewerCandidate = model.candidateOptions.some(
    (member) => member.userId === viewerUserId
  );
  const viewerOptionLabel = userName ? `${userName}さん（本人）` : "本人";

  return (
    <div className="space-y-3">
      <Select
        label="成績を表示する人"
        description="現在表示中の人は成績見出しにも表示されます。"
        value={model.selectedUserId}
        disabled={!model.canChangeTarget}
        onChange={(event) => onChangeTarget(event.target.value)}
        className="min-h-11 focus-visible:ring-2 focus-visible:ring-focus"
      >
        {!hasViewerCandidate ? (
          <option value={viewerUserId}>{viewerOptionLabel}</option>
        ) : null}
        {model.candidateOptions.map((member) => (
          <option key={member.userId} value={member.userId}>
            {member.userId === viewerUserId
              ? viewerOptionLabel
              : `${member.userName}さん`}
          </option>
        ))}
      </Select>

      <p className="text-sm text-text-muted" aria-live="polite">
        現在表示中: {model.selectedUserName}
        {model.selectedUserName === "本人" ? "" : "さん"}
        {model.isViewingSelf ? "（本人）" : ""}
      </p>

      {model.isLoading ? (
        <LoadingState
          label="参加者一覧を読み込んでいます。本人の成績を表示します。"
          className="justify-start p-0"
        />
      ) : null}

      {model.membersError ? (
        <ErrorState
          message={
            membersError
              ? `${membersError} 本人の成績を表示しています。`
              : "表示対象者の一覧を取得できませんでした。本人の成績を表示しています。"
          }
          onRetry={retryMembers}
        />
      ) : null}

      {membersStatus === "ready" && model.candidateOptions.length === 0 ? (
        <p className="text-sm text-text-muted" role="status">
          参加者候補がありません。本人の成績を表示しています。
        </p>
      ) : null}
    </div>
  );
};
