import { BarChart3, Home, Trophy } from "lucide-react";

// TODO: 中身は要調整
export const NAV_ITEMS = [
  {
    icon: Home,
    label: "ダッシュボード",
    href: "/",
    active: typeof window !== "undefined" && window.location.pathname === "/",
  },
  {
    icon: Trophy,
    label: "リーグ",
    href: "/league/new",
    active:
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/league"),
  },
  {
    icon: BarChart3,
    label: "成績",
    href: "/stats",
    active:
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/stats"),
  },
];
