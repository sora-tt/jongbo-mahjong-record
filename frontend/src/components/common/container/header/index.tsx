"use client";

import { LogOut, Menu, Settings, User, X } from "lucide-react";

import Link from "next/link";

import { NAV_ITEMS } from "./constants";
import { useHeader } from "./hooks/index";

export const Header: React.FC = () => {
  const {
    name,
    isMenuOpen,
    setIsMenuOpen,
    handleClose,
    handleLogout,
    isLoggingOut,
  } =
    useHeader();

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b-2 border-[#F4D4D4]">
        {/* 上部バー */}
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* 左：ロゴ + アプリ名 */}
          <Link href="/" className="flex items-center gap-2">
            {/* ロゴ（TODO: 後日いい感じのに変更） */}
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-500 shadow-sm">
              <div className="grid grid-cols-2 gap-[1px]">
                <span className="block h-3 w-3 rounded-[2px] bg-white/90" />
                <span className="block h-3 w-3 rounded-[2px] bg-white/70" />
                <span className="block h-3 w-3 rounded-[2px] bg-white/70" />
                <span className="block h-3 w-3 rounded-[2px] bg-white/50" />
              </div>
            </div>
            {/* アプリ名（TODO: フォント等調整） */}
            <span className="ml-2 text-xl font-bold text-[#E8736B]">
              jongbo
            </span>
          </Link>

          {/* 右：ハンバーガーメニュー */}
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-full hover:bg-[#FFF5F5] transition-colors"
          >
            {isMenuOpen ? (
              <X size={20} className="text-[#E8736B]" />
            ) : (
              <Menu size={20} className="text-[#E8736B]" />
            )}
          </button>
        </div>
      </header>

      <div
        className={`
          fixed inset-y-0 right-0 z-50 
          w-64 bg-white border-l-2 border-[#F4D4D4]
          flex flex-col h-full
          transform transition-transform duration-300 ease-in-out
          ${isMenuOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* 上部：閉じる */}
        <div className="flex items-center justify-end px-4 py-3">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#8B6B6B] hover:bg-[#FFFAF8]"
            aria-label="メニューを閉じる"
          >
            <X size={20} className="text-[#E8736B]" />
          </button>
        </div>

        {/* ナビゲーション部分 */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* ログイン中ユーザー */}
          <div className="mb-4 rounded-lg border border-[#F4D4D4] bg-[#FFFAF8] px-3 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF5F5] text-[#E8736B]">
                <User size={18} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#8B6B6B]">
                  ログイン中のユーザー
                </span>
                <span className="text-sm font-medium text-[#4A3636]">
                  {name ? `${name} さん` : "ゲスト"}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="space-y-1">
            {NAV_ITEMS.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                onClick={handleClose}
                className={`flex items-center rounded-lg px-3 py-2 transition-colors duration-150 ${
                  item.active
                    ? "bg-[#FFF5F5] text-[#E8736B]"
                    : "text-[#8B6B6B] hover:bg-[#FFFAF8]"
                }`}
              >
                <item.icon size={18} strokeWidth={1.5} />
                <span className="ml-3 font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 設定とログアウト */}
        <div className="border-t-2 border-[#F4D4D4] p-4">
          <div className="space-y-1">
            <Link
              href="/settings"
              onClick={handleClose}
              className="flex items-center rounded-lg px-3 py-2 text-[#8B6B6B] transition-colors duration-150 hover:bg-[#FFFAF8]"
            >
              <Settings size={18} strokeWidth={1.5} />
              <span className="ml-3 font-medium">設定</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center rounded-lg px-3 py-2 text-[#8B6B6B] transition-colors duration-150 hover:bg-[#FFFAF8]"
            >
              <LogOut size={18} strokeWidth={1.5} />
              <span className="ml-3 font-medium">
                {isLoggingOut ? "ログアウト中..." : "ログアウト"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
