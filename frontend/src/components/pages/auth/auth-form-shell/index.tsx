import * as React from "react";

import { Spacer } from "@/components/common/ui/spacer";
import { LinkArea } from "@/components/pages/entry-pages/link-area";
import { Button } from "@/components/ui/button";

type FooterLink = {
  href: string;
  label: string;
};

type AuthFormShellProps = React.PropsWithChildren<{
  title: string;
  error: string | null;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: () => void;
  footerLinks: FooterLink[];
}>;

export const AuthFormShell: React.FC<AuthFormShellProps> = ({
  title,
  error,
  submitLabel,
  isSubmitting,
  onSubmit,
  footerLinks,
  children,
}) => {
  return (
    <Spacer
      minHeight="screen"
      display="flex"
      className="items-center justify-center bg-white text-black"
    >
      <Spacer
        display="flex flex-col"
        gap="xsmall"
        padding="medium"
        rounded="lg"
        border={{ color: "brand-200", width: "2" }}
      >
        <Spacer>
          <h3 className="text-center text-lg font-bold">{title}</h3>
        </Spacer>
        {children}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button fullWidth disabled={isSubmitting} onClick={onSubmit}>
          {submitLabel}
        </Button>
        {footerLinks.map((link) => (
          <LinkArea key={link.href} attrs={{ href: link.href }}>
            {link.label}
          </LinkArea>
        ))}
      </Spacer>
    </Spacer>
  );
};
