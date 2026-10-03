import type { StatisticsView } from "./query-cache";

const statisticsViews: readonly StatisticsView[] = [
  "overview",
  "analysis",
  "history",
];

export const getNextStatisticsView = (
  currentView: StatisticsView,
  key: string
): StatisticsView | null => {
  const currentIndex = statisticsViews.indexOf(currentView);

  if (key === "Home") return statisticsViews[0] ?? null;
  if (key === "End") return statisticsViews[statisticsViews.length - 1] ?? null;
  if (key === "ArrowRight") {
    return statisticsViews[(currentIndex + 1) % statisticsViews.length] ?? null;
  }
  if (key === "ArrowLeft") {
    return (
      statisticsViews[
        (currentIndex - 1 + statisticsViews.length) % statisticsViews.length
      ] ?? null
    );
  }

  return null;
};
