import * as React from "react";

import { Button } from "@/components/v2/ui/button";
import { ButtonLink } from "@/components/v2/ui/button-link";

export const SeasonFormActions = ({
  label,
  onSubmit,
  loading,
  disabled,
  backHref,
}: {
  label: string;
  onSubmit: () => void;
  loading: boolean;
  disabled?: boolean;
  backHref: string;
}) => (
  <div className="flex flex-col items-center gap-4 px-6 pt-2">
    <Button
      size="lg"
      fullWidth
      onClick={onSubmit}
      loading={loading}
      disabled={disabled}
    >
      {label}
    </Button>
    <ButtonLink
      href={backHref}
      variant="tertiary"
      className="!font-normal !text-v2-text-secondary"
    >
      ← 戻る
    </ButtonLink>
  </div>
);
