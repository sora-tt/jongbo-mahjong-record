"use client";

import * as React from "react";

import {
  BarChart3,
  ChevronLeft,
  Home,
  Settings,
  Settings2,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";

import { useProfileName } from "@/providers/profile-name-provider";

import { Avatar } from "@/components/ui/avatar";
import { IconButtonLink } from "@/components/ui/icon-button-link";

type Props = React.PropsWithChildren<{
  title?: string;
  backHref?: string;
  settingsHref?: string;
  bottomNav?: boolean;
  activeNav?: "home" | "statistics" | "settings";
}>;
export const AppShell = ({
  children,
  title,
  backHref,
  settingsHref,
  bottomNav = false,
  activeNav = "home",
}: Props) => {
  const { profileName } = useProfileName();
  return (
    <div className="min-h-screen bg-app-canvas text-app-text">
      <header className="sticky top-0 z-20 bg-app-canvas pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-[60px] max-w-5xl items-center justify-between px-4">
          {title !== undefined ? (
            <>
              <IconButtonLink
                href={backHref ?? "/"}
                aria-label="戻る"
                variant="tertiary"
                className="!border-0 !text-app-text-secondary"
              >
                <ChevronLeft size={24} strokeWidth={1.75} />
              </IconButtonLink>
              {title ? (
                <h1 className="min-w-0 truncate text-center text-app-heading-2 font-bold">
                  {title}
                </h1>
              ) : (
                <span aria-hidden="true" />
              )}
              {settingsHref ? (
                <IconButtonLink
                  href={settingsHref}
                  aria-label="設定"
                  variant="tertiary"
                  className="!border-0"
                >
                  <Settings size={24} strokeWidth={1.8} />
                </IconButtonLink>
              ) : (
                <span className="size-11" />
              )}
            </>
          ) : (
            <>
              <Link href="/" aria-label="jongbo ホーム">
                <Image
                  src="/icons/jongbo-wordmark.svg"
                  alt="jongbo"
                  width={128}
                  height={26}
                  priority
                  className="h-[26px] w-auto"
                />
              </Link>
              <Avatar name={profileName} />
            </>
          )}
        </div>
      </header>
      {children}
      {bottomNav && (
        <nav
          aria-label="メインナビゲーション"
          className="fixed inset-x-0 bottom-0 z-20 border-t border-app-border bg-app-surface pb-[env(safe-area-inset-bottom)]"
        >
          <div className="mx-auto grid h-[74px] max-w-xl grid-cols-3 text-center text-app-caption font-semibold text-app-text-secondary">
            <Link
              href="/"
              aria-current={activeNav === "home" ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 ${activeNav === "home" ? "text-app-brand-strong" : ""}`}
            >
              <Home size={20} />
              ホーム
            </Link>
            <Link
              href="/stats"
              aria-current={activeNav === "statistics" ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 ${activeNav === "statistics" ? "text-app-brand-strong" : ""}`}
            >
              <BarChart3 size={20} />
              成績
            </Link>
            <Link
              href="/settings"
              aria-current={activeNav === "settings" ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 ${activeNav === "settings" ? "text-app-brand-strong" : ""}`}
            >
              <Settings2 size={20} />
              設定
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
};
