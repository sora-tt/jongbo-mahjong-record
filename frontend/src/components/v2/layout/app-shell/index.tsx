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

import { useProfileName } from "@/providers/v2-profile-name-provider";

import { Avatar } from "@/components/v2/ui/avatar";
import { IconButtonLink } from "@/components/v2/ui/icon-button-link";

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
    <div className="min-h-screen bg-v2-canvas text-v2-text">
      <header className="sticky top-0 z-20 bg-v2-canvas pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-[60px] max-w-5xl items-center justify-between px-4">
          {title !== undefined ? (
            <>
              <IconButtonLink
                href={backHref ?? "/v2"}
                aria-label="戻る"
                variant="tertiary"
                className="!border-0 !text-v2-text-secondary"
              >
                <ChevronLeft size={24} strokeWidth={1.75} />
              </IconButtonLink>
              {title ? (
                <h1 className="min-w-0 truncate text-center text-v2-heading-2 font-bold">
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
              <Link href="/v2" aria-label="jongbo ホーム">
                <Image
                  src="/icons/jongbo-wordmark-v2.svg"
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
          className="fixed inset-x-0 bottom-0 z-20 border-t border-v2-border bg-v2-surface pb-[env(safe-area-inset-bottom)]"
        >
          <div className="mx-auto grid h-[74px] max-w-xl grid-cols-3 text-center text-v2-caption font-semibold text-v2-text-secondary">
            <Link
              href="/v2"
              aria-current={activeNav === "home" ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 ${activeNav === "home" ? "text-v2-brand-strong" : ""}`}
            >
              <Home size={20} />
              ホーム
            </Link>
            <Link
              href="/v2/stats"
              aria-current={activeNav === "statistics" ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 ${activeNav === "statistics" ? "text-v2-brand-strong" : ""}`}
            >
              <BarChart3 size={20} />
              成績
            </Link>
            <Link
              href="/v2/settings"
              aria-current={activeNav === "settings" ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 ${activeNav === "settings" ? "text-v2-brand-strong" : ""}`}
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
