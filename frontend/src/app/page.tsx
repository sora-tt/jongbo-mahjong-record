"use client";

import * as React from "react";

import { AppShell } from "@/components/layout/app-shell";
import CreateLeagueCard from "@/components/pages/home/create-league-card/index";
import EmptyLeagueState from "@/components/pages/home/empty-league-state";
import LeagueCard from "@/components/pages/home/league-card/index";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

import { useHome } from "./hooks";

export const Home: React.FC = () => {
  const { userName, leagues, hasLeagues, isLoading, error } = useHome();

  return (
    <AppShell mainClassName="min-h-screen bg-background font-jp">
      {isLoading ? (
        <LoadingState
          label="リーグ情報を読み込んでいます…"
          className="min-h-[calc(100vh-4rem)]"
        />
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text-dark mb-2">
              {userName ? `${userName}さんのリーグ一覧` : "リーグ一覧"}
            </h1>
            <p className="text-text-muted">
              記録を振り返ったり、新しいリーグを作成できます
            </p>
          </div>

          {hasLeagues ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leagues.map((league) => (
                <LeagueCard
                  key={league.id}
                  leagueId={league.id}
                  leagueName={league.name}
                  memberCount={league.memberCount}
                  totalMatchCount={league.totalMatchCount}
                  activeSeason={league.activeSeason}
                  myRank={league.myStanding?.rank ?? null}
                />
              ))}
              <CreateLeagueCard />
            </div>
          ) : (
            <EmptyLeagueState />
          )}

          {error ? <ErrorState message={error} /> : null}
        </div>
      )}
    </AppShell>
  );
};

export default Home;
