export const parseIntegerInput = (value: string) => {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
};

export type UmaRank = "first" | "second" | "third" | "fourth";
export type FixedUmaDraft = Record<UmaRank, string>;
export type FloatingCount = 0 | 1 | 2 | 3 | 4;
export type FloatingCountUmaDraft = Record<FloatingCount, FixedUmaDraft>;

export type UmaRowTotalError = {
  actualTotal: number;
  message: string;
};

export type UmaFieldErrors = Partial<Record<UmaRank, string>>;

export type FixedUmaDraftErrors = {
  fields?: UmaFieldErrors;
  total?: UmaRowTotalError;
};

export type FloatingCountUmaDraftErrors = Partial<
  Record<FloatingCount, FixedUmaDraftErrors>
>;

const FLOATING_COUNT_VALUES = [0, 1, 2, 3, 4] as const;
const DEFAULT_FLOATING_COUNT_UMA: FloatingCountUmaDraft = {
  0: { first: "0", second: "0", third: "0", fourth: "0" },
  1: { first: "12", second: "-1", third: "-3", fourth: "-8" },
  2: { first: "8", second: "4", third: "-4", fourth: "-8" },
  3: { first: "8", second: "3", third: "1", fourth: "-12" },
  4: { first: "0", second: "0", third: "0", fourth: "0" },
};

export const createDefaultFloatingCountUmaDraft =
  (): FloatingCountUmaDraft => ({
    0: { ...DEFAULT_FLOATING_COUNT_UMA[0] },
    1: { ...DEFAULT_FLOATING_COUNT_UMA[1] },
    2: { ...DEFAULT_FLOATING_COUNT_UMA[2] },
    3: { ...DEFAULT_FLOATING_COUNT_UMA[3] },
    4: { ...DEFAULT_FLOATING_COUNT_UMA[4] },
  });

export const validateFixedUmaDraft = (
  gameType: "sanma" | "yonma",
  values: FixedUmaDraft
): FixedUmaDraftErrors => {
  const fields = validateUmaFields(values, getUmaRanks(gameType));
  if (Object.keys(fields).length > 0) {
    return { fields };
  }

  const actualTotal = getUmaRanks(gameType).reduce(
    (total, rank) => total + (parseIntegerInput(values[rank]) ?? 0),
    0
  );
  return actualTotal === 0
    ? {}
    : {
        total: {
          actualTotal,
          message: `ウマの合計が0ではありません（現在: ${actualTotal}）`,
        },
      };
};

export const validateFloatingCountUmaDraft = (
  rows: FloatingCountUmaDraft
): FloatingCountUmaDraftErrors => {
  const errors: FloatingCountUmaDraftErrors = {};

  for (const floatingCount of FLOATING_COUNT_VALUES) {
    const row = rows[floatingCount];
    const fields = validateUmaFields(row, UMA_RANKS);
    if (Object.keys(fields).length > 0) {
      errors[floatingCount] = { fields };
      continue;
    }

    const actualTotal = UMA_RANKS.reduce(
      (total, rank) => total + (parseIntegerInput(row[rank]) ?? 0),
      0
    );
    if (actualTotal !== 0) {
      errors[floatingCount] = {
        total: {
          actualTotal,
          message: `${floatingCount}人浮きの順位点合計が0ではありません（現在: ${actualTotal}）`,
        },
      };
    }
  }

  return errors;
};

const UMA_RANKS: readonly UmaRank[] = ["first", "second", "third", "fourth"];

const getUmaRanks = (gameType: "sanma" | "yonma") =>
  gameType === "sanma" ? UMA_RANKS.slice(0, 3) : UMA_RANKS;

const validateUmaFields = (
  values: FixedUmaDraft,
  ranks: readonly UmaRank[]
): UmaFieldErrors => {
  const errors: UmaFieldErrors = {};

  for (const rank of ranks) {
    const value = values[rank];
    if (!value.trim()) {
      errors[rank] = "順位点を入力してください";
    } else if (parseIntegerInput(value) === null) {
      errors[rank] = "順位点は整数で入力してください";
    }
  }

  return errors;
};

export const getUmaTotalError = (values: readonly string[]) => {
  if (values.some((value) => !value.trim())) {
    return null;
  }

  const parsedValues = values.map(parseIntegerInput);
  if (parsedValues.some((value) => value === null)) {
    return "ウマは整数で入力してください";
  }

  const total = parsedValues.reduce<number>(
    (sum, value) => sum + (value ?? 0),
    0
  );
  return total === 0
    ? null
    : `ウマの合計が0になるように入力してください（現在: ${total}）`;
};
