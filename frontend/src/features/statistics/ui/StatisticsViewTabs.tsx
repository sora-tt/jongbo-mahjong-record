import * as React from "react";

import { getNextStatisticsView } from "@/features/statistics/model/view-tabs";

import type { StatisticsView } from "@/features/statistics/model/query-cache";

type Props = {
  activeView: StatisticsView;
  onActiveViewChange: (view: StatisticsView) => void;
  panels: Record<StatisticsView, React.ReactNode>;
};

const viewOptions: readonly { value: StatisticsView; label: string }[] = [
  { value: "overview", label: "概要" },
  { value: "analysis", label: "分析" },
  { value: "history", label: "対局履歴" },
];

export const StatisticsViewTabs: React.FC<Props> = ({
  activeView,
  onActiveViewChange,
  panels,
}) => {
  const generatedId = React.useId().replace(/:/g, "");
  const tabRefs = React.useRef<
    Record<StatisticsView, HTMLButtonElement | null>
  >({
    overview: null,
    analysis: null,
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
        className="grid grid-cols-3 gap-1 rounded-xl bg-surface-muted p-1"
      >
        {viewOptions.map(({ value, label }) => {
          const selected = activeView === value;

          return (
            <button
              key={value}
              ref={(element) => {
                tabRefs.current[value] = element;
              }}
              id={tabId(value)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId(value)}
              tabIndex={selected ? 0 : -1}
              onClick={() => onActiveViewChange(value)}
              onKeyDown={(event) => handleKeyDown(event, value)}
              className={`min-h-11 rounded-lg px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:text-sm ${selected ? "bg-brand-50 text-brand-strong" : "text-text-muted hover:bg-background hover:text-foreground"}`}
            >
              {label}
            </button>
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
