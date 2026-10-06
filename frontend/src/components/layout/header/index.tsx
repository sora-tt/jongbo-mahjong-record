"use client";

import * as React from "react";

import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Menu,
  Trophy,
  User,
  X,
} from "lucide-react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/providers/auth-provider";

import { HeaderNavigationModelContext } from "@/components/layout/navigation/context";
import type {
  HeaderNavigationSection,
  LeagueNavigationItem,
  NavigationLink,
  NavigationLoadState,
} from "@/components/layout/navigation/types";

const NAVIGATION_SECTIONS = [
  { id: "leagues", label: "リーグ", icon: Trophy },
  { id: "statistics", label: "成績", icon: BarChart3 },
] as const satisfies readonly {
  id: HeaderNavigationSection;
  label: string;
  icon: typeof Trophy;
}[];

export const Header: React.FC = () => {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { user, logout } = useAuth();
  const navigation = React.useContext(HeaderNavigationModelContext);
  const { expandedLeagueIds, expandedSection, toggleLeague, toggleSection } =
    navigation;
  const menuToggleRef = React.useRef<HTMLButtonElement>(null);
  const drawerCloseRef = React.useRef<HTMLButtonElement>(null);
  const hasOpenedMenuRef = React.useRef(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const closeMenu = React.useCallback(() => {
    setIsMenuOpen(false);
    expandedLeagueIds.forEach(toggleLeague);
    if (expandedSection) {
      toggleSection(expandedSection);
    }
  }, [expandedLeagueIds, expandedSection, toggleLeague, toggleSection]);
  const closeMenuRef = React.useRef(closeMenu);
  const previousPathnameRef = React.useRef(pathname);

  const openMenu = React.useCallback(() => setIsMenuOpen(true), []);

  React.useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeMenu, isMenuOpen]);

  React.useEffect(() => {
    closeMenuRef.current = closeMenu;
  }, [closeMenu]);

  React.useEffect(() => {
    if (isMenuOpen) {
      hasOpenedMenuRef.current = true;
      drawerCloseRef.current?.focus();
      return;
    }

    if (hasOpenedMenuRef.current) {
      hasOpenedMenuRef.current = false;
      menuToggleRef.current?.focus();
    }
  }, [isMenuOpen]);

  React.useEffect(() => {
    const pathnameChanged = previousPathnameRef.current !== pathname;
    previousPathnameRef.current = pathname;
    if (pathnameChanged && isMenuOpen) {
      closeMenuRef.current();
    }
  }, [isMenuOpen, pathname]);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      await logout();
      closeMenu();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const displayName = user?.displayName ?? user?.email ?? "ゲスト";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            aria-label="jongbo ホーム"
          >
            <span
              className="grid h-9 w-9 grid-cols-2 gap-0.5 rounded-control bg-brand-600 p-1.5 shadow-sm"
              aria-hidden="true"
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <span key={index} className="rounded-[2px] bg-white/80" />
              ))}
            </span>
            <span className="text-xl font-bold tracking-tight text-brand-strong">
              jongbo
            </span>
          </Link>

          <NavigationSections
            model={navigation}
            pathname={pathname}
            presentation="desktop"
          />

          <div className="hidden items-center gap-3 lg:flex">
            <span className="flex items-center gap-2 text-sm text-text-muted">
              <User size={17} aria-hidden="true" />
              <span>{displayName}</span>
            </span>
            <button
              type="button"
              className="rounded-control px-3 py-2 text-sm text-text-muted transition-colors hover:bg-brand-50 hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "ログアウト中…" : "ログアウト"}
            </button>
          </div>

          <button
            ref={menuToggleRef}
            type="button"
            className="rounded-control p-2 text-brand-strong hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus lg:hidden"
            onClick={isMenuOpen ? closeMenu : openMenu}
            aria-label={isMenuOpen ? "メニューを閉じる" : "メニューを開く"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {isMenuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          aria-label="メニューを閉じる"
          onClick={closeMenu}
        />
      ) : null}

      <aside
        id="mobile-navigation"
        className={`fixed inset-y-0 right-0 z-50 flex w-80 max-w-[88vw] flex-col border-l border-border bg-white shadow-xl transition-transform duration-200 lg:hidden ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!isMenuOpen}
        inert={!isMenuOpen}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <span className="font-semibold text-foreground">メニュー</span>
          <button
            ref={drawerCloseRef}
            type="button"
            className="rounded-control p-2 text-text-muted hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            onClick={closeMenu}
            aria-label="メニューを閉じる"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <div className="flex items-center gap-3 rounded-surface bg-surface-muted p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-strong">
              <User size={18} aria-hidden="true" />
            </span>
            <span className="min-w-0 truncate text-sm font-medium text-foreground">
              {displayName}
            </span>
          </div>
          <NavigationSections
            model={navigation}
            pathname={pathname}
            presentation="mobile"
            onNavigate={closeMenu}
          />
        </div>
        <div className="border-t border-border p-4">
          <button
            type="button"
            className="w-full rounded-control px-3 py-2 text-left text-sm text-text-muted hover:bg-brand-50 hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "ログアウト中…" : "ログアウト"}
          </button>
        </div>
      </aside>
    </>
  );
};

type NavigationSectionsProps = {
  model: React.ContextType<typeof HeaderNavigationModelContext>;
  pathname: string;
  presentation: "desktop" | "mobile";
  onNavigate?: () => void;
};

const NavigationSections: React.FC<NavigationSectionsProps> = ({
  model,
  pathname,
  presentation,
  onNavigate,
}) => {
  const sectionToggleRefs = React.useRef<
    Partial<Record<HeaderNavigationSection, HTMLButtonElement>>
  >({});

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (
      presentation !== "desktop" ||
      event.key !== "Escape" ||
      !model.expandedSection
    ) {
      return;
    }

    event.preventDefault();
    model.expandedLeagueIds.forEach(model.toggleLeague);
    const expandedSection = model.expandedSection;
    model.toggleSection(expandedSection);
    sectionToggleRefs.current[expandedSection]?.focus();
  };

  return (
    <nav
      className={
        presentation === "desktop"
          ? "hidden items-center gap-1 lg:flex"
          : "space-y-1"
      }
      aria-label={
        presentation === "desktop"
          ? "メインナビゲーション"
          : "モバイルメインナビゲーション"
      }
      onKeyDown={handleKeyDown}
    >
      {NAVIGATION_SECTIONS.map(({ id, label, icon: Icon }) => {
        const isExpanded = model.expandedSection === id;
        const isActive =
          id === "leagues"
            ? pathname.startsWith("/league")
            : pathname.startsWith("/stats");
        const panelId = `header-navigation-${presentation}-${id}`;

        return (
          <div
            key={id}
            className={presentation === "desktop" ? "relative" : ""}
          >
            <button
              ref={(element) => {
                if (element) {
                  sectionToggleRefs.current[id] = element;
                }
              }}
              type="button"
              className={`flex items-center gap-2 rounded-control px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${presentation === "mobile" ? "w-full justify-between" : ""} ${isActive ? "bg-brand-50 text-brand-strong" : "text-text-muted hover:bg-surface-muted hover:text-foreground"}`}
              onClick={() => {
                const willOpen = model.expandedSection !== id;
                model.toggleSection(id);
                if (
                  willOpen &&
                  id === "leagues" &&
                  model.leagues.status === "idle"
                ) {
                  model.loadLeagues();
                }
              }}
              aria-expanded={isExpanded}
              aria-controls={panelId}
            >
              <span className="flex items-center gap-2">
                <Icon size={17} aria-hidden="true" />
                {label}
              </span>
              <ChevronDown
                size={16}
                aria-hidden="true"
                className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
              />
            </button>
            <div
              id={panelId}
              hidden={!isExpanded}
              className={`z-50 mt-1 max-h-96 overflow-y-auto rounded-surface border border-border bg-white p-2 shadow-lg ${presentation === "desktop" ? "absolute left-0 top-full min-w-64" : "ml-3"}`}
            >
              {id === "leagues" ? (
                <LeagueLinks
                  state={model.leagues}
                  expandedLeagueIds={model.expandedLeagueIds}
                  onToggleLeague={model.toggleLeague}
                  onLoadSeasons={model.loadSeasons}
                  onRetryLeagues={model.retryLeagues}
                  onRetrySeasons={model.retrySeasons}
                  pathname={pathname}
                  onNavigate={onNavigate}
                  presentation={presentation}
                />
              ) : (
                <div className="space-y-1">
                  {model.statistics.map((item) => (
                    <NavigationAnchor
                      key={item.id}
                      item={item}
                      pathname={pathname}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </nav>
  );
};

type LeagueLinksProps = {
  state: NavigationLoadState<LeagueNavigationItem>;
  expandedLeagueIds: readonly string[];
  onToggleLeague: (leagueId: string) => void;
  onLoadSeasons: (leagueId: string) => void;
  onRetryLeagues: () => void;
  onRetrySeasons: (leagueId: string) => void;
  pathname: string;
  onNavigate?: () => void;
  presentation: "desktop" | "mobile";
};

const LeagueLinks: React.FC<LeagueLinksProps> = ({
  state,
  expandedLeagueIds,
  onToggleLeague,
  onLoadSeasons,
  onRetryLeagues,
  onRetrySeasons,
  pathname,
  onNavigate,
  presentation,
}) => (
  <div className="space-y-1">
    <NavigationLoadFeedback
      state={state}
      subject="リーグ一覧"
      onRetry={onRetryLeagues}
    />
    {state.items.map((league) => {
      const isExpanded = expandedLeagueIds.includes(league.id);
      const seasonListId = `header-navigation-${presentation}-seasons-${encodeURIComponent(league.id)}`;

      return (
        <div key={league.id}>
          <div className="flex items-center gap-1">
            <NavigationAnchor
              item={league}
              pathname={pathname}
              onNavigate={onNavigate}
              className="min-w-0 flex-1"
            />
            <button
              type="button"
              className="rounded-control p-2 text-text-muted hover:bg-brand-50 hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              onClick={() => {
                onToggleLeague(league.id);
                if (!isExpanded && league.seasons.status === "idle") {
                  onLoadSeasons(league.id);
                }
              }}
              aria-label={`${league.label}のシーズンを${isExpanded ? "閉じる" : "開く"}`}
              aria-expanded={isExpanded}
              aria-controls={seasonListId}
            >
              <ChevronRight
                size={16}
                aria-hidden="true"
                className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
              />
            </button>
          </div>
          <div
            id={seasonListId}
            hidden={!isExpanded}
            className="ml-3 space-y-1"
          >
            <NavigationLoadFeedback
              state={league.seasons}
              subject={`${league.label}のシーズン一覧`}
              onRetry={() => onRetrySeasons(league.id)}
            />
            {league.seasons.items.map((season) => (
              <NavigationAnchor
                key={season.id}
                item={season}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

type NavigationLoadFeedbackProps = {
  state: NavigationLoadState<unknown>;
  subject: string;
  onRetry: () => void;
};

const NavigationLoadFeedback: React.FC<NavigationLoadFeedbackProps> = ({
  state,
  subject,
  onRetry,
}) => {
  if (state.status === "ready" || state.status === "idle") {
    return null;
  }

  if (state.status === "error") {
    return (
      <div className="space-y-2 rounded-control border border-error-border bg-error-bg p-3 text-sm text-error-text">
        <p role="alert">
          {state.message || `${subject}を取得できませんでした。`}
        </p>
        <button
          type="button"
          className="rounded-control px-2 py-1 font-medium underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          onClick={onRetry}
          aria-label={`${subject}を再試行`}
        >
          再試行
        </button>
      </div>
    );
  }

  const message =
    state.status === "empty"
      ? `${subject}はありません。`
      : `${subject}を読み込んでいます…`;

  return (
    <p
      role="status"
      aria-live="polite"
      className="px-3 py-2 text-sm text-text-muted"
    >
      {message}
    </p>
  );
};

type NavigationAnchorProps = {
  item: NavigationLink;
  pathname: string;
  onNavigate?: () => void;
  className?: string;
};

const NavigationAnchor: React.FC<NavigationAnchorProps> = ({
  item,
  pathname,
  onNavigate,
  className = "",
}) => {
  const hrefPathname = item.href.split(/[?#]/, 1)[0] || "/";
  const isActive =
    pathname === hrefPathname || pathname.startsWith(`${hrefPathname}/`);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center rounded-control px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${className} ${isActive ? "bg-brand-50 text-brand-strong" : "text-text-muted hover:bg-surface-muted hover:text-foreground"}`}
    >
      <span className="truncate">{item.label}</span>
    </Link>
  );
};

export default Header;
