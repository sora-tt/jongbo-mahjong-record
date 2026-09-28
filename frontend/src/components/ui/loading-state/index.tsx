import * as React from "react";

type LoadingStateProps = {
  label?: string;
  className?: string;
};

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = "読み込み中です",
  className = "",
}) => (
  <div
    className={`flex items-center justify-center gap-2 p-8 text-sm text-text-muted ${className}`}
    role="status"
    aria-live="polite"
  >
    <span
      className="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-strong"
      aria-hidden="true"
    />
    <span>{label}</span>
  </div>
);
