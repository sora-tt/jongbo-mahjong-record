export const formatStreak = ({
  count,
  unit,
}: {
  count: number;
  unit: string;
}) => {
  return `${count.toLocaleString("ja-JP")}${unit}`;
};

export const formatScore = ({ score }: { score: number }) => {
  return `${score.toLocaleString("ja-JP")}点`;
};
