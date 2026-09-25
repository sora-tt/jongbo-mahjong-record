import * as React from "react";

export type SectionCardProps = {
  title: string;
  rightText?: string;
  children: React.ReactNode;
  bodyClassName?: string;
};

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  rightText,
  children,
  bodyClassName = "",
}) => {
  return (
    <div className="overflow-hidden rounded-surface border border-border bg-white shadow-sm">
      <div className="flex items-baseline justify-between border-b border-border bg-brand-600 px-4 pb-2 pt-3">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {rightText && <p className="text-xs text-white">{rightText}</p>}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
};
