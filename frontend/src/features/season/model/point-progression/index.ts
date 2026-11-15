import type { toPointProgressionChart } from "@/features/statistics/model/adapter";

type Chart = ReturnType<typeof toPointProgressionChart>;

export const toSeasonProgressionData = ({ data, series }: Chart) => {
  if (data.length === 0 || series.length === 0) return [];

  const totals: Record<string, number> = Object.fromEntries(
    series.map(({ userId }) => [userId, 0])
  );
  const initial = { matchIndex: 0, ...totals };
  const orderedData = [...data].sort((a, b) => a.matchIndex - b.matchIndex);

  return [
    initial,
    ...orderedData.map((row) => {
      for (const { userId } of series) {
        totals[userId] = row[userId] ?? totals[userId];
      }
      return { matchIndex: row.matchIndex, ...totals };
    }),
  ];
};
