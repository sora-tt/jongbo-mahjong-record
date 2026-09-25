"use client";

import * as React from "react";

import { BarChart3, Home, Menu, Trophy, User, X } from "lucide-react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/providers/auth-provider";

const NAV_ITEMS = [
  {
    label: "ダッシュボード",
    href: "/",
    icon: Home,
    isActive: (pathname: string) => pathname === "/",
  },
  {
    label: "リーグ",
    href: "/",
    icon: Trophy,
    isActive: (pathname: string) => pathname.startsWith("/league"),
  },
  {
    label: "成績",
    href: "/stats",
    icon: BarChart3,
    isActive: (pathname: string) => pathname.startsWith("/stats"),
  },
] as const;

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const closeMenu = React.useCallback(() => setIsMenuOpen(false), []);

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
            className="flex shrink-0 items-center gap-2"
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

          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="メインナビゲーション"
          >
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.label} item={item} pathname={pathname} />
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <span className="flex items-center gap-2 text-sm text-text-muted">
              <User size={17} aria-hidden="true" />
              <span>{displayName}</span>
            </span>
            <button
              type="button"
              className="rounded-control px-3 py-2 text-sm text-text-muted transition-colors hover:bg-brand-50 hover:text-brand-strong disabled:opacity-60"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "ログアウト中…" : "ログアウト"}
            </button>
          </div>

          <button
            type="button"
            className="rounded-control p-2 text-brand-strong hover:bg-brand-50 lg:hidden"
            onClick={() => setIsMenuOpen((current) => !current)}
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
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <span className="font-semibold text-foreground">メニュー</span>
          <button
            type="button"
            className="rounded-control p-2 text-text-muted hover:bg-brand-50"
            onClick={closeMenu}
            aria-label="メニューを閉じる"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <div className="flex items-center gap-3 rounded-surface bg-surface-muted p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-strong">
              <User size={18} />
            </span>
            <span className="min-w-0 truncate text-sm font-medium text-foreground">
              {displayName}
            </span>
          </div>
          <nav className="space-y-1" aria-label="モバイルメインナビゲーション">
            {NAV_ITEMS.map((item) => (
              <NavItem
                key={item.label}
                item={item}
                pathname={pathname}
                onNavigate={closeMenu}
                mobile
              />
            ))}
          </nav>
        </div>
        <div className="border-t border-border p-4">
          <button
            type="button"
            className="w-full rounded-control px-3 py-2 text-left text-sm text-text-muted hover:bg-brand-50 hover:text-brand-strong disabled:opacity-60"
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

type NavItemProps = {
  item: (typeof NAV_ITEMS)[number];
  pathname: string;
  onNavigate?: () => void;
  mobile?: boolean;
};

const NavItem: React.FC<NavItemProps> = ({
  item,
  pathname,
  onNavigate,
  mobile,
}) => {
  const isActive = item.isActive(pathname);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-2 rounded-control px-3 py-2 text-sm font-medium transition-colors ${mobile ? "w-full" : ""} ${isActive ? "bg-brand-50 text-brand-strong" : "text-text-muted hover:bg-surface-muted hover:text-foreground"}`}
    >
      <Icon size={17} aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
};

export default Header;
