import * as React from "react";

import CreateLeagueCard from "@/components/pages/home/create-league-card/index";
import EmptyLeagueState from "@/components/pages/home/empty-league-state";
import LeagueCard from "@/components/pages/home/league-card/index";

import { useHome } from "./hooks";

export const Home: React.FC = () => {
  const { userId, userName, leagues, hasLeagues, error } = useHome();

  return (
    <div className="flex-1 bg-white min-h-full font-jp">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-dark mb-2">
            {userName}さんのリーグ一覧
          </h1>
          <p className="text-text-muted">
            記録を振り返ったり、新しいリーグを作成できます
          </p>
        </div>

        {/* Leagues Grid */}
        {hasLeagues ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leagues.map((league) => (
              <LeagueCard userId={userId} leagueId={league.id} />
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
    </div>
  );
};

export default Home;
