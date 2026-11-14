"use client";
import * as React from "react";

import { Plus } from "lucide-react";

import Link from "next/link";

import { useHome } from "@/features/home/hooks/use-home";
import { LeagueCard } from "@/features/league/ui/v2/league-card";
import { useProfileName } from "@/providers/v2-profile-name-provider";

import { AppShell } from "@/components/v2/layout/app-shell";
import { Card } from "@/components/v2/ui/card";
import { PageLoading } from "@/components/v2/ui/page-loading";
import { Status } from "@/components/v2/ui/status";

const Home = () => {
  const { userId, userName, leagues, isLoading, error, retry } = useHome("/v2");
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
        <h1 className="mb-8 text-center text-v2-display font-bold">ホーム</h1>
        <div className="mb-2 flex items-center justify-between text-v2-caption font-semibold text-v2-brand-strong">
          <h2>参加中のリーグ</h2>
          <span>{String(leagues.length).padStart(2, "0")}</span>
        </div>
        <div className="space-y-3">
          {error && <Status message={error} onRetry={retry} />}{" "}
          {leagues.map((league) => (
            <LeagueCard key={league.id} league={league} userId={userId} />
          ))}
          {!error && leagues.length === 0 && (
            <p className="rounded-v2-panel bg-v2-surface p-4 text-v2-label text-v2-text-secondary">
              参加中のリーグはありません。
            </p>
          )}
          <Card soft size="none">
            <Link
              href="/v2/league/new"
              className="flex min-h-[60px] items-center gap-3 px-5 text-v2-label font-semibold text-v2-brand-strong"
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
