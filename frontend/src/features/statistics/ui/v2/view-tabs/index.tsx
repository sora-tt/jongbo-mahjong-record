import * as React from "react";

import { getNextStatisticsView } from "@/features/statistics/model/view-tabs";

import { Tab } from "@/components/v2/ui/tab";

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
      <div
        role="tablist"
        aria-label="成績表示"
        aria-orientation="horizontal"
        className="relative grid grid-cols-4 gap-1 rounded-v2-control bg-[var(--v2-neutral-200)] p-1"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-1 left-1 w-[calc(25%-0.3125rem)] rounded-v2-control bg-v2-surface shadow-v2-card transition-transform duration-200 motion-reduce:transition-none"
          style={{
            transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 0.25}rem))`,
          }}
        />
        {viewOptions.map(({ value, label }) => {
          const selected = activeView === value;

          return (
            <Tab
              key={value}
              selected={selected}
              ref={(element) => {
                tabRefs.current[value] = element;
              }}
              id={tabId(value)}
              type="button"
              aria-controls={panelId(value)}
              tabIndex={selected ? 0 : -1}
              onClick={() => onActiveViewChange(value)}
              onKeyDown={(event) => handleKeyDown(event, value)}
              className={`relative !border-0 !bg-transparent !px-1 !text-v2-caption transition-colors ${selected ? "!text-v2-brand-strong" : "!text-v2-text-secondary"}`}
            >
              {label}
            </Tab>
          );
        })}
      </div>

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
