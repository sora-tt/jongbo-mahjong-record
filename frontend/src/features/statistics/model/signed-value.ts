export const getStatisticsSignedValueTextClass = (value: number | null) => {
  if (value === null || value === 0) return "text-app-text";
  return value > 0 ? "text-blue-500" : "text-red-500";
};

export const getStatisticsRawScoreTextClass = (
  value: number | null,
  startingPoints: number | null | undefined
) => {
  if (value === null || startingPoints == null) return "text-app-text";
  return value >= startingPoints ? "text-blue-500" : "text-red-500";
};
