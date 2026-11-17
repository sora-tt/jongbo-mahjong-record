import * as React from "react";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

export const SeasonFormActions = ({
  label,
  onSubmit,
  loading,
  disabled,
  backHref,
  showBackLink = true,
  footerAction,
}: {
  label: string;
  onSubmit: () => void;
  loading: boolean;
  disabled?: boolean;
  backHref: string;
  showBackLink?: boolean;
  footerAction?: React.ReactNode;
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
    {showBackLink && (
      <ButtonLink
        href={backHref}
        variant="tertiary"
        className="!font-normal !text-app-text-secondary"
      >
        ← 戻る
      </ButtonLink>
    )}
    {footerAction && <div className="mt-4 w-full">{footerAction}</div>}
  </div>
);
