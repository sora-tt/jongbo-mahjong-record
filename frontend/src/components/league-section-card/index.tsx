import * as React from "react";

export type LeagueSectionCardProps = {
  title: string;
  rightText?: string;
  children: React.ReactNode;
  bodyClassName?: string;
};

const LeagueSectionCard: React.FC<LeagueSectionCardProps> = ({
  title,
  rightText,
  children,
  bodyClassName = "",
}) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden border border-brand-200 shadow-sm">
      <div className="flex items-baseline justify-between px-4 pt-3 pb-2 border-b-2 border-brand-500 bg-gradient-to-r from-brand-500 to-brand-400">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {rightText && <p className="text-xs text-white">{rightText}</p>}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
};

export default LeagueSectionCard;
