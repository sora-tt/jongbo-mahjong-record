import * as React from "react";

import clsx from "clsx";

import Link from "next/link";

import { Button } from "@/components/v2/ui/button";

type AuthFormProps = React.PropsWithChildren<{
  title: string;
  error: string | null;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: () => void;
  links: { href: string; label: string; secondary?: boolean }[];
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
  <main className="box-border flex min-h-screen supports-[height:100dvh]:min-h-dvh items-center justify-center bg-v2-canvas pt-[calc(32px+env(safe-area-inset-top))] pr-[calc(44px+env(safe-area-inset-right))] pb-[calc(32px+env(safe-area-inset-bottom))] pl-[calc(44px+env(safe-area-inset-left))]">
    <section className="w-full max-w-[302px]">
      <h1 className="mb-6 text-center text-v2-display font-bold">{title}</h1>
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
            className="text-v2-label font-normal text-v2-danger"
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
        className="mt-6 flex flex-col items-center gap-6 text-center text-v2-brand-strong"
        aria-label="認証関連リンク"
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "hover:underline",
              link.secondary
                ? "text-v2-caption font-normal"
                : "text-v2-label font-semibold"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </section>
  </main>
);
