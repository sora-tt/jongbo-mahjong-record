"use client";

import * as React from "react";

import Header from "@/components/common/container/header";
import CreateLeagueCard from "@/components/pages/home/create-league-card/index";
import EmptyLeagueState from "@/components/pages/home/empty-league-state";
import LeagueCard from "@/components/pages/home/league-card/index";

import { useHome } from "./hooks";

export const Home: React.FC = () => {
  const { userName, leagues, hasLeagues, isLoading, error } = useHome();

  return (
    <div className="flex-1 bg-white min-h-full font-jp">
      <Header />
      {isLoading ? (
        <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4 text-center text-text-muted">
          リーグ情報を読み込んでいます...
        </div>
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

          {error && (
            <div className="mt-8 bg-error-bg border-2 border-error-border rounded-lg p-4">
              <p className="text-error-text text-sm">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
