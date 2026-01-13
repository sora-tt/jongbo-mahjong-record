import * as React from "react";

type MetaItem = {
  icon?: React.ReactNode;
  label: string;
};

type Props = {
  title: string;
  metaItems?: MetaItem[];
  align?: "left" | "center";
};

export const HeaderCard: React.FC<Props> = ({
  title,
  metaItems = [],
  align = "left",
}) => {
  const titleAlignClass = align === "center" ? "text-center" : "text-left";
  const metaJustifyClass =
    align === "center" ? "justify-center" : "justify-start";

  return (
    <div className="rounded-lg border border-brand-500 bg-gradient-to-r from-brand-500 to-brand-400 shadow-sm px-4 py-4">
      <h1 className={`text-2xl font-bold text-white mb-2 ${titleAlignClass}`}>
        {title}
      </h1>
      {metaItems.length > 0 && (
        <div
          className={`flex flex-wrap ${metaJustifyClass} items-center gap-x-4 gap-y-1 text-xs text-white`}
        >
          {metaItems.map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-1">
              {item.icon}
              <span>{item.label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
