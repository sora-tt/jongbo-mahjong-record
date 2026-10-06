import {
  emptyParticipants,
  type GameType,
  type ParticipantByWind,
  type Wind,
} from "./participants";

import type { ApiMatch } from "@/lib/api/contracts";

const WINDS_BY_GAME_TYPE: Record<GameType, readonly Wind[]> = {
  sanma: ["east", "south", "west"],
  yonma: ["east", "south", "west", "north"],
};

export const INVALID_SEAT_ASSIGNMENT_REASON =
  "invalid_previous_assignment" as const;

export type RotationMatch = Pick<ApiMatch, "matchIndex" | "results">;

export type SeatRotationResult =
  | { ok: true; userIdByWind: ParticipantByWind }
  | { ok: false; reason: typeof INVALID_SEAT_ASSIGNMENT_REASON };

export const findLatestMatchByIndex = (matches: ReadonlyArray<RotationMatch>) =>
  matches.reduce<RotationMatch | undefined>(
    (latest, match) =>
      !latest || match.matchIndex > latest.matchIndex ? match : latest,
    undefined
  );

export const getNextSeatAssignment = (
  gameType: GameType,
  previousMatch: Pick<ApiMatch, "results">
): SeatRotationResult => {
  const requiredWinds = WINDS_BY_GAME_TYPE[gameType];
  if (previousMatch.results.length !== requiredWinds.length) {
    return { ok: false, reason: INVALID_SEAT_ASSIGNMENT_REASON };
  }

  const userIdByWind = emptyParticipants();
  const seenWinds = new Set<Wind>();
  const seenUsers = new Set<string>();

  for (const result of previousMatch.results) {
    const currentWindIndex = requiredWinds.indexOf(result.wind);
    if (typeof result.userId !== "string" || !result.userId.trim()) {
      return { ok: false, reason: INVALID_SEAT_ASSIGNMENT_REASON };
    }

    const userId = result.userId;
    if (
      currentWindIndex < 0 ||
      seenWinds.has(result.wind) ||
      seenUsers.has(userId)
    ) {
      return { ok: false, reason: INVALID_SEAT_ASSIGNMENT_REASON };
    }

    const nextWind =
      requiredWinds[(currentWindIndex + 1) % requiredWinds.length];
    userIdByWind[nextWind] = userId;
    seenWinds.add(result.wind);
    seenUsers.add(userId);
  }

  if (requiredWinds.some((wind) => !userIdByWind[wind])) {
    return { ok: false, reason: INVALID_SEAT_ASSIGNMENT_REASON };
  }

  return { ok: true, userIdByWind };
};
