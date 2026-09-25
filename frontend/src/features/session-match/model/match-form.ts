import {
  type ParticipantByWind,
  type ParticipantConstraint,
  type Wind,
  validateParticipants,
  WINDS,
} from "./participants";

import type { ApiMatch } from "@/lib/api/contracts";

export type MatchFormMode = "initial" | "additional" | "edit";

export type MatchFormValues = {
  playedAt: string;
  userIdByWind: ParticipantByWind;
  rawScoreByWind: Readonly<Record<Wind, string>>;
};

export type MatchInputResult = {
  userId: string;
  wind: Wind;
  rawScore: number;
};

export type MatchValidationInput = {
  values: MatchFormValues;
  constraint: ParticipantConstraint;
  allowedMembers: Parameters<typeof validateParticipants>[0]["allowedMembers"];
  startingPoints: number;
};

export const parseRawScore = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || !/^[-+]?\d+$/.test(trimmed)) {
    return null;
  }

  const scoreInHundreds = Number(trimmed);
  if (!Number.isSafeInteger(scoreInHundreds)) {
    return null;
  }

  return scoreInHundreds * 100;
};

export const validateMatchForm = (input: MatchValidationInput) => {
  const participantError = validateParticipants({
    constraint: input.constraint,
    participants: input.values.userIdByWind,
    allowedMembers: input.allowedMembers,
  });
  if (participantError) {
    return { message: participantError, results: null };
  }

  if (
    !input.values.playedAt ||
    Number.isNaN(Date.parse(input.values.playedAt))
  ) {
    return { message: "対局日時を入力してください", results: null };
  }

  const results: MatchInputResult[] = [];
  for (const wind of input.constraint.requiredWinds) {
    const userId = input.values.userIdByWind[wind];
    const rawScore = parseRawScore(input.values.rawScoreByWind[wind] ?? "");
    if (!userId || rawScore === null) {
      return { message: "全員分の点数を整数で入力してください", results: null };
    }
    results.push({ userId, wind, rawScore });
  }

  const expectedTotal = input.startingPoints * input.constraint.memberCount;
  const actualTotal = results.reduce((sum, result) => sum + result.rawScore, 0);
  if (actualTotal !== expectedTotal) {
    return {
      message: `合計点数は ${expectedTotal.toLocaleString()} 点になるよう入力してください`,
      results: null,
    };
  }

  return { message: null, results };
};

export const createEmptyMatchFormValues = (): MatchFormValues => ({
  playedAt: new Date().toISOString(),
  userIdByWind: {
    east: null,
    south: null,
    west: null,
    north: null,
  },
  rawScoreByWind: {
    east: "",
    south: "",
    west: "",
    north: "",
  },
});

export const toMatchFormValues = (match: ApiMatch): MatchFormValues => {
  const userIdByWind: Record<Wind, string | null> = {
    east: null,
    south: null,
    west: null,
    north: null,
  };
  const rawScoreByWind: Record<Wind, string> = {
    east: "",
    south: "",
    west: "",
    north: "",
  };

  for (const result of match.results) {
    userIdByWind[result.wind] = String(result.userId);
    rawScoreByWind[result.wind] = String(result.rawScore / 100);
  }

  return { playedAt: match.playedAt, userIdByWind, rawScoreByWind };
};

export const hasOnlyRequiredWinds = (
  participants: ParticipantByWind,
  constraint: ParticipantConstraint
) =>
  WINDS.every((wind) =>
    constraint.requiredWinds.includes(wind)
      ? Boolean(participants[wind])
      : !participants[wind]
  );
