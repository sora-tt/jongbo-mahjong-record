import * as React from "react";

import clsx from "clsx";

import Link from "next/link";

import { Button } from "@/components/ui/button";

type AuthFormLink =
  | { href: string; label: string; secondary?: boolean }
  | { disabled: true; label: string; secondary?: boolean };

type AuthFormProps = React.PropsWithChildren<{
  title: string;
  error: string | null;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: () => void;
  links: AuthFormLink[];
}>;

export const AuthForm = ({
  title,
  error,
  submitLabel,
  isSubmitting,
  onSubmit,
  links,
  children,
}: AuthFormProps) => (
  <main className="box-border flex min-h-screen supports-[height:100dvh]:min-h-dvh items-center justify-center bg-app-canvas pt-[calc(32px+env(safe-area-inset-top))] pr-[calc(44px+env(safe-area-inset-right))] pb-[calc(32px+env(safe-area-inset-bottom))] pl-[calc(44px+env(safe-area-inset-left))]">
    <section className="w-full max-w-[302px]">
      <h1 className="mb-6 text-center text-app-display font-bold">{title}</h1>
      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {children}
        {error && (
          <p
            className="text-app-label font-normal text-app-danger"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </p>
        )}
        <Button
          className="!h-12"
          type="submit"
          fullWidth
          loading={isSubmitting}
        >
          {submitLabel}
        </Button>
      </form>
      <nav
        className="mt-6 flex flex-col items-center gap-6 text-center text-app-brand-strong"
        aria-label="認証関連リンク"
      >
        {links.map((link) => {
          const className = clsx(
            link.secondary
              ? "text-app-caption font-normal"
              : "text-app-label font-semibold",
            "disabled" in link
              ? "cursor-default text-app-text-secondary"
              : "hover:underline"
          );

          return "disabled" in link ? (
            <span key={link.label} aria-disabled="true" className={className}>
              {link.label}
            </span>
          ) : (
            <Link key={link.href} href={link.href} className={className}>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </section>
  </main>
);
