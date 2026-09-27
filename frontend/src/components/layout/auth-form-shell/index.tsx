import * as React from "react";

import Link from "next/link";

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
}) => (
  <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
    <section className="w-full max-w-md rounded-surface border border-border bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-center text-2xl font-bold text-foreground">
        {title}
      </h1>
      <form
        className="mt-6 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {children}
        {error ? (
          <p
            className="rounded-control border border-error-border bg-error-bg px-3 py-2 text-sm text-error-text"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </p>
        ) : null}
        <Button type="submit" fullWidth loading={isSubmitting}>
          {submitLabel}
        </Button>
      </form>
      <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
        {footerLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-brand-strong underline-offset-4 hover:underline"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  </main>
);
