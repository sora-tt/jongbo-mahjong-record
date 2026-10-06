import {
  createDefaultFloatingCountUmaDraft,
  parseIntegerInput,
  validateFixedUmaDraft,
  validateFloatingCountUmaDraft,
  type FixedUmaDraft,
  type FloatingCount,
  type FloatingCountUmaDraft,
  type UmaRank,
} from "./validation";

import type { ApiLeague } from "@/lib/api/contracts";

export type LeagueGameType = "sanma" | "yonma";
export type UmaMode = "fixed" | "floatingCount";

export type LeagueRuleDraft = {
  gameType: LeagueGameType;
  mode: UmaMode;
  okaStartPoints: string;
  okaReturnPoints: string;
  chomboPenaltyPoints: string;
  allowOffTableKyotaku: boolean;
  rotateSeatOrder: boolean;
  fixedUma: FixedUmaDraft;
  floatingCountUma: FloatingCountUmaDraft;
};

export type LeagueRulePayload = ApiLeague["rule"];

export type BuildLeagueRuleResult =
  | { ok: true; rule: LeagueRulePayload }
  | { ok: false; error: string };

const FLOATING_COUNTS: readonly FloatingCount[] = [0, 1, 2, 3, 4];
const RANKS: readonly UmaRank[] = ["first", "second", "third", "fourth"];

export const createDefaultLeagueRuleDraft = (): LeagueRuleDraft => ({
  gameType: "yonma",
  mode: "fixed",
  okaStartPoints: "",
  okaReturnPoints: "",
  chomboPenaltyPoints: "0",
  allowOffTableKyotaku: false,
  rotateSeatOrder: false,
  fixedUma: { first: "", second: "", third: "", fourth: "" },
  floatingCountUma: createDefaultFloatingCountUmaDraft(),
});

export const toLeagueRuleDraft = (rule: ApiLeague["rule"]): LeagueRuleDraft => {
  const uma = rule.uma;
  let fixedUma: FixedUmaDraft;
  let floatingCountUma: FloatingCountUmaDraft;

  if (uma.mode === "fixed") {
    fixedUma = {
      first: uma.first.toString(),
      second: uma.second.toString(),
      third: uma.third.toString(),
      fourth: uma.fourth?.toString() ?? "",
    };
    floatingCountUma = createDefaultFloatingCountUmaDraft();
  } else {
    fixedUma = { first: "", second: "", third: "", fourth: "" };
    floatingCountUma = Object.fromEntries(
      FLOATING_COUNTS.map((floatingCount) => [
        floatingCount,
        Object.fromEntries(
          RANKS.map((rank) => [
            rank,
            uma.pointsByFloatingCount[floatingCount][rank].toString(),
          ])
        ),
      ])
    ) as FloatingCountUmaDraft;
  }

  return {
    gameType: rule.gameType,
    mode: uma.mode,
    okaStartPoints: rule.oka.startingPoints.toString(),
    okaReturnPoints: rule.oka.returnPoints.toString(),
    chomboPenaltyPoints: String(rule.chomboPenaltyPoints ?? 0),
    allowOffTableKyotaku: rule.allowOffTableKyotaku ?? false,
    rotateSeatOrder: rule.rotateSeatOrder ?? false,
    fixedUma,
    floatingCountUma,
  };
};

const firstValidationMessage = (
  errors: ReturnType<typeof validateFixedUmaDraft>
) => errors.total?.message ?? Object.values(errors.fields ?? {})[0];

const parseFixedUma = (draft: FixedUmaDraft) => ({
  first: parseIntegerInput(draft.first),
  second: parseIntegerInput(draft.second),
  third: parseIntegerInput(draft.third),
  fourth: parseIntegerInput(draft.fourth),
});

export const buildLeagueRulePayload = (
  draft: LeagueRuleDraft
): BuildLeagueRuleResult => {
  const startingPoints = parseIntegerInput(draft.okaStartPoints);
  const returnPoints = parseIntegerInput(draft.okaReturnPoints);
  if (startingPoints === null || returnPoints === null) {
    return { ok: false, error: "持ち点と返し点を整数で入力してください" };
  }

  const chomboPenaltyPoints = parseIntegerInput(draft.chomboPenaltyPoints);
  if (chomboPenaltyPoints === null || chomboPenaltyPoints < 0) {
    return {
      ok: false,
      error: "チョンボ罰符は0以上の整数で入力してください",
    };
  }

  const oka = { startingPoints, returnPoints };
  const activeMode = draft.gameType === "sanma" ? "fixed" : draft.mode;

  if (activeMode === "floatingCount") {
    const rowErrors = validateFloatingCountUmaDraft(draft.floatingCountUma);
    const invalidRow = FLOATING_COUNTS.find(
      (floatingCount) => rowErrors[floatingCount]
    );
    if (invalidRow !== undefined) {
      const errors = rowErrors[invalidRow];
      return {
        ok: false,
        error:
          errors?.total?.message ??
          `${invalidRow}人浮きの${Object.values(errors?.fields ?? {})[0] ?? "順位点を確認してください"}`,
      };
    }

    const pointsByFloatingCount = Object.fromEntries(
      FLOATING_COUNTS.map((floatingCount) => [
        floatingCount,
        Object.fromEntries(
          RANKS.map((rank) => [
            rank,
            parseIntegerInput(draft.floatingCountUma[floatingCount][rank]),
          ])
        ),
      ])
    ) as Record<FloatingCount, Record<UmaRank, number>>;

    return {
      ok: true,
      rule: {
        gameType: "yonma",
        uma: { mode: "floatingCount", pointsByFloatingCount },
        oka,
        chomboPenaltyPoints,
        allowOffTableKyotaku: draft.allowOffTableKyotaku,
        rotateSeatOrder: draft.rotateSeatOrder,
      },
    };
  }

  const fixedErrors = validateFixedUmaDraft(draft.gameType, draft.fixedUma);
  const validationMessage = firstValidationMessage(fixedErrors);
  if (validationMessage) {
    return { ok: false, error: validationMessage };
  }

  const uma = parseFixedUma(draft.fixedUma);
  if (
    uma.first === null ||
    uma.second === null ||
    uma.third === null ||
    (draft.gameType === "yonma" && uma.fourth === null)
  ) {
    return { ok: false, error: "モードに応じた順位点をすべて入力してください" };
  }

  if (draft.gameType === "sanma") {
    return {
      ok: true,
      rule: {
        gameType: "sanma",
        uma: {
          mode: "fixed",
          first: uma.first,
          second: uma.second,
          third: uma.third,
          fourth: null,
        },
        oka,
        chomboPenaltyPoints,
        allowOffTableKyotaku: draft.allowOffTableKyotaku,
        rotateSeatOrder: draft.rotateSeatOrder,
      },
    };
  }

  return {
    ok: true,
    rule: {
      gameType: "yonma",
      uma: {
        mode: "fixed",
        first: uma.first,
        second: uma.second,
        third: uma.third,
        fourth: uma.fourth as number,
      },
      oka,
      chomboPenaltyPoints,
      allowOffTableKyotaku: draft.allowOffTableKyotaku,
      rotateSeatOrder: draft.rotateSeatOrder,
    },
  };
};
