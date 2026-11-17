import type { toPointProgressionChart } from "@/features/statistics/model/adapter";

type Chart = ReturnType<typeof toPointProgressionChart>;

export const toSeasonProgressionData = ({ data, series }: Chart) => {
  if (data.length === 0 || series.length === 0) return [];

  const orderedData = [...data].sort((a, b) => a.matchIndex - b.matchIndex);
  const valuesByUser = series.map(({ userId }) => ({
    userId,
    values: orderedData
      .map((row) => row[userId])
      .filter((value): value is number => typeof value === "number"),
  }));
  const maxMatches = Math.max(
    ...valuesByUser.map(({ values }) => values.length)
  );
  if (maxMatches === 0) return [];

  return Array.from({ length: maxMatches + 1 }, (_, matchIndex) => {
    const row: { matchIndex: number; [userId: string]: number } = {
      matchIndex,
    };
    for (const { userId, values } of valuesByUser) {
      if (values.length > 0 && matchIndex === 0) row[userId] = 0;
      else if (matchIndex > 0 && matchIndex <= values.length)
        row[userId] = values[matchIndex - 1];
    }
    return row;
  });
};
