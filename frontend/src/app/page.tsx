"use client";
import * as React from "react";

import { Plus } from "lucide-react";

import Link from "next/link";

import { useHome } from "@/features/home/hooks/use-home";
import { LeagueCard } from "@/features/league/ui/league-card";
import { useProfileName } from "@/providers/profile-name-provider";

import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/page-loading";
import { Status } from "@/components/ui/status";

const Home = () => {
  const { userId, userName, leagues, isLoading, error, retry } = useHome();
  const { setProfileName } = useProfileName();
  React.useEffect(() => {
    if (userName) setProfileName(userName);
  }, [userName, setProfileName]);
  if (isLoading) {
    return (
      <AppShell bottomNav>
        <PageLoading label="リーグ情報を読み込んでいます…" bottomNav />
      </AppShell>
    );
  }
  return (
    <AppShell bottomNav>
      <main className="mx-auto max-w-[480px] px-4 pb-28 pt-5">
        <h1 className="mb-8 text-center text-app-display font-bold">ホーム</h1>
        <div className="mb-2 flex items-center justify-between text-app-caption font-semibold text-app-brand-strong">
          <h2>参加中のリーグ</h2>
          <span>{String(leagues.length).padStart(2, "0")}</span>
        </div>
        <div className="space-y-3">
          {error && <Status message={error} onRetry={retry} />}{" "}
          {leagues.map((league) => (
            <LeagueCard key={league.id} league={league} userId={userId} />
          ))}
          {!error && leagues.length === 0 && (
            <p className="rounded-app-panel bg-app-surface p-4 text-app-label text-app-text-secondary">
              参加中のリーグはありません。
            </p>
          )}
          <Card soft size="none">
            <Link
              href="/league/new"
              className="flex min-h-[60px] items-center gap-3 px-5 text-app-label font-semibold text-app-brand-strong"
            >
              <Plus size={20} />
              新しいリーグを作成
            </Link>
          </Card>
        </div>
      </main>
    </AppShell>
  );
};
export default Home;
