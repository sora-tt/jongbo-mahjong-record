export const parseIntegerInput = (value: string) => {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
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
