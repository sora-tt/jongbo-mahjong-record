import type {
  ApiLeague,
  ApiSeasonMember,
  ApiSession,
} from "@/lib/api/contracts";

export const WINDS = ["east", "south", "west", "north"] as const;
export type Wind = (typeof WINDS)[number];
export type GameType = ApiLeague["rule"]["gameType"];
export type SessionMember = ApiSession["members"][number];

export type ParticipantByWind = Readonly<Record<Wind, string | null>>;

export type ParticipantConstraint = {
  gameType: GameType;
  requiredWinds: readonly Wind[];
  memberCount: 3 | 4;
};

export const getParticipantConstraint = (
  gameType: GameType
): ParticipantConstraint =>
  gameType === "sanma"
    ? {
        gameType,
        requiredWinds: ["east", "south", "west"],
        memberCount: 3,
      }
    : {
        gameType,
        requiredWinds: WINDS,
        memberCount: 4,
      };

export const emptyParticipants = (): Record<Wind, string | null> => ({
  east: null,
  south: null,
  west: null,
  north: null,
});

export const membersToParticipants = (
  members: ReadonlyArray<SessionMember>
): Record<Wind, string | null> => {
  const participants = emptyParticipants();
  WINDS.forEach((wind, index) => {
    participants[wind] = members[index]?.userId ?? null;
  });
  return participants;
};

export const toPlayerOptions = (
  members: ReadonlyArray<ApiSeasonMember | SessionMember>
) =>
  members.map((member) => ({
    label: member.userName,
    value: member.userId,
  }));

export const validateParticipants = (input: {
  constraint: ParticipantConstraint;
  participants: ParticipantByWind;
  allowedMembers: ReadonlyArray<ApiSeasonMember | SessionMember>;
}) => {
  const { constraint, participants, allowedMembers } = input;
  const selectedIds = constraint.requiredWinds.map(
    (wind) => participants[wind]
  );
  const allowedIds = new Set(
    allowedMembers.map((member) => String(member.userId))
  );

  if (selectedIds.some((userId) => !userId)) {
    return "参加者をすべて選択してください";
  }

  const ids = selectedIds.filter((userId): userId is string => Boolean(userId));
  if (new Set(ids).size !== ids.length) {
    return "同じ参加者を複数の席に設定できません";
  }

  if (ids.some((userId) => !allowedIds.has(String(userId)))) {
    return "シーズンの参加者から選択してください";
  }

  if (constraint.gameType === "sanma" && participants.north) {
    return "三麻では北の席を使用できません";
  }

  return null;
};
