import * as React from "react";

import clsx from "clsx";

type Align = "left" | "center";

const TITLE_ALIGN_CLASS: Record<Align, string> = {
  left: "text-left",
  center: "text-center",
};

const META_JUSTIFY_CLASS: Record<Align, string> = {
  left: "justify-start",
  center: "justify-center",
};

type Props = {
  title: string;
  align?: Align;
  children?: React.ReactNode;
};

export const HeaderCard: React.FC<Props> = ({
  title,
  align = "left",
  children,
}) => {
  return (
    <div className="rounded-surface border border-brand-600 bg-brand-600 px-4 py-4 shadow-sm">
      <h1
        className={clsx(
          "text-2xl font-bold text-white mb-2",
          TITLE_ALIGN_CLASS[align]
        )}
      >
        {title}
      </h1>

      {children && (
        <div
          className={clsx(
            "flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white",
            META_JUSTIFY_CLASS[align]
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};
