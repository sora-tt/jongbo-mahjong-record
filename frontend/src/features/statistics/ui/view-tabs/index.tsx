import * as React from "react";

import { getNextStatisticsView } from "@/features/statistics/model/view-tabs";

import {
  SlidingSegmentedControl,
  SlidingSegmentedControlButton,
} from "@/components/ui/sliding-segmented-control";

import type { StatisticsView } from "@/features/statistics/model/query-cache";

type Props = {
  activeView: StatisticsView;
  onActiveViewChange: (view: StatisticsView) => void;
  panels: Record<StatisticsView, React.ReactNode>;
};

const viewOptions: readonly { value: StatisticsView; label: string }[] = [
  { value: "overview", label: "総合" },
  { value: "trend", label: "推移" },
  { value: "comparisons", label: "分析" },
  { value: "history", label: "履歴" },
];

export const StatisticsViewTabs: React.FC<Props> = ({
  activeView,
  onActiveViewChange,
  panels,
}) => {
  const generatedId = React.useId().replace(/:/g, "");
  const activeIndex = viewOptions.findIndex(
    ({ value }) => value === activeView
  );
  const tabRefs = React.useRef<
    Record<StatisticsView, HTMLButtonElement | null>
  >({
    overview: null,
    trend: null,
    comparisons: null,
    history: null,
  });
  const tabId = (view: StatisticsView) =>
    `statistics-view-${generatedId}-${view}-tab`;
  const panelId = (view: StatisticsView) =>
    `statistics-view-${generatedId}-${view}-panel`;

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentView: StatisticsView
  ) => {
    const nextView = getNextStatisticsView(currentView, event.key);
    if (!nextView) return;

    event.preventDefault();
    onActiveViewChange(nextView);
    tabRefs.current[nextView]?.focus();
  };

  return (
    <div className="space-y-4">
      <SlidingSegmentedControl
        role="tablist"
        label="成績表示"
        selectedIndex={activeIndex}
        count={viewOptions.length}
      >
        {viewOptions.map(({ value, label }) => {
          const selected = activeView === value;

          return (
            <SlidingSegmentedControlButton
              key={value}
              selected={selected}
              role="tab"
              ref={(element) => {
                tabRefs.current[value] = element;
              }}
              id={tabId(value)}
              type="button"
              aria-controls={panelId(value)}
              tabIndex={selected ? 0 : -1}
              onClick={() => onActiveViewChange(value)}
              onKeyDown={(event) => handleKeyDown(event, value)}
            >
              {label}
            </SlidingSegmentedControlButton>
          );
        })}
      </SlidingSegmentedControl>

      {viewOptions.map(({ value }) => {
        const selected = activeView === value;

        return (
          <div
            key={value}
            id={panelId(value)}
            role="tabpanel"
            aria-labelledby={tabId(value)}
            hidden={!selected}
            tabIndex={0}
          >
            {selected ? panels[value] : null}
          </div>
        );
      })}
    </div>
  );
};
