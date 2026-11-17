import * as React from "react";

import { Input } from "@/components/ui/input";

type Props = Omit<
  React.ComponentProps<typeof Input>,
  "label" | "containerClassName"
>;

export const SeasonNameField = (props: Props) => {
  const suffixId = React.useId();
  const describedBy = [props["aria-describedby"], suffixId]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex items-end gap-3">
      <Input
        {...props}
        label="シーズン名"
        containerClassName="min-w-0 flex-1"
        aria-describedby={describedBy}
      />
      <span id={suffixId} className="pb-3 text-app-label font-semibold">
        シーズン
      </span>
    </div>
  );
};
