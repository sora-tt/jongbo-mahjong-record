import type { StatisticsScopeFilters } from "./query-cache";

export type StatisticsSubjectMember = {
  userId: string;
  userName: string;
};

export type StatisticsSubjectMembersStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error";

type StatisticsSubjectSelectorInput = {
  scopeType: StatisticsScopeFilters["scopeType"];
  viewerUserId: string;
  targetUserId: string;
  userName: string;
  members: readonly StatisticsSubjectMember[];
  membersStatus: StatisticsSubjectMembersStatus;
};

export const getStatisticsSubjectSelectorModel = ({
  scopeType,
  viewerUserId,
  targetUserId,
  userName,
  members,
  membersStatus,
}: StatisticsSubjectSelectorInput) => {
  const candidateOptions =
    scopeType !== "overall" && membersStatus === "ready"
      ? members.filter(
          (member, index) =>
            member.userId.length > 0 &&
            members.findIndex(
              (candidate) => candidate.userId === member.userId
            ) === index
        )
      : [];
  const matchingTarget = candidateOptions.find(
    (member) => member.userId === targetUserId
  );
  const selectedMember =
    matchingTarget ??
    candidateOptions.find((member) => member.userId === viewerUserId);
  const selectedUserId = selectedMember?.userId ?? viewerUserId;
  const isViewingSelf = selectedUserId === viewerUserId;

  return {
    visible: scopeType !== "overall",
    candidateOptions,
    selectedUserId,
    selectedUserName:
      selectedMember?.userName ||
      (isViewingSelf ? userName || "本人" : "参加者"),
    isViewingSelf,
    isLoading: membersStatus === "idle" || membersStatus === "loading",
    membersError: membersStatus === "error",
    canChangeTarget:
      membersStatus === "ready" &&
      candidateOptions.some((member) => member.userId !== selectedUserId),
  };
};
