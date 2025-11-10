import * as React from "react";

import CreateLeagueCard from "@/components/create-league-card/index";
import LeagueCard from "@/components/league-card/index";

import { useHome } from "@/app/home/hooks/index";

export const Home: React.FC = () => {
  const { user, leagues, error, hasLeagues } = useHome();

  return (
    <div className="flex-1 bg-white min-h-full font-jp">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-dark mb-2">
            こんにちは、{user?.name || "ユーザー"}さん
          </h1>
          <p className="text-text-muted">
            麻雀の記録を管理して、友達と楽しい時間を過ごしましょう
          </p>
        </div>

        {/* Leagues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hasLeagues ? (
            leagues.map((league) => (
              <LeagueCard
                key={league.id}
                league={league}
                recentScore="+12,000点"
              />
            ))
          ) : (
            <CreateLeagueCard hasLeagues={false} />
          )}
          {/* 右端に常に「新規作成」カードを出したいならここは固定配置でもOK */}
          <CreateLeagueCard hasLeagues /> {/* TODO: onClick設定 */}
        </div>

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
