import { BarChart3, Home, PlusCircle, Trophy, Users } from "lucide-react";

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
    href: "/leagues",
    active:
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/leagues"),
  },
  {
    icon: PlusCircle,
    label: "対局記録",
    href: "/games/new",
    active:
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/games"),
  },
  {
    icon: BarChart3,
    label: "成績",
    href: "/personal-record",
    active:
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/personal-record"),
  },
  {
    icon: Users,
    label: "メンバー",
    href: "/members",
    active:
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/members"),
  },
];
