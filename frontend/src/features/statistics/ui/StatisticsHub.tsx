import * as React from "react";

import Link from "next/link";

import { buildStatisticsHref } from "@/features/statistics/model/page";

import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

type JoiningSeason = {
  id: string;
  leagueId: string;
  leagueName: string;
  seasonId: string;
  seasonName: string;
};

type League = {
  id: string;
  name: string;
  activeSeason: { id: string; name: string } | null;
};

type Props = {
  viewerUserId: string;
  seasons: readonly JoiningSeason[];
  leagues: readonly League[];
  status: "loading" | "ready" | "error";
  onRetry: () => void;
};

const StatsEntry: React.FC<{
  href: string;
  title: string;
  subtitle: string;
}> = ({ href, title, subtitle }) => (
  <Link
    href={href}
    className="block min-h-16 rounded-control border border-border p-4 transition-colors hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
  >
    <span className="block font-semibold text-foreground">{title}</span>
    <span className="mt-1 block text-sm text-text-muted">{subtitle}</span>
  </Link>
);

export const StatisticsHub: React.FC<Props> = ({
  viewerUserId,
  seasons,
  leagues,
  status,
  onRetry,
}) => {
  const activeSeasonKeys = new Set(
    leagues
      .filter((league) => league.activeSeason)
      .map((league) => `${league.id}:${league.activeSeason?.id}`)
  );
  const activeSeasons = seasons.filter((season) =>
    activeSeasonKeys.has(`${season.leagueId}:${season.seasonId}`)
  );
  const otherSeasons = seasons.filter(
    (season) => !activeSeasonKeys.has(`${season.leagueId}:${season.seasonId}`)
  );

  if (status === "loading") {
    return <LoadingState label="参加中のリーグを読み込んでいます…" />;
  }

  if (status === "error") {
    return (
      <ErrorState
        message="参加中のリーグを表示できません。"
        onRetry={onRetry}
      />
    );
  }

  return (
    <section className="space-y-5" aria-labelledby="statistics-hub-heading">
      <header className="space-y-2">
        <h1
          id="statistics-hub-heading"
          className="text-2xl font-bold text-foreground"
        >
          成績
        </h1>
        <p className="text-sm text-text-muted">
          参加中のリーグ・シーズンから成績を確認できます。
        </p>
      </header>

      {activeSeasons.length > 0 ? (
        <Card title="進行中のシーズン">
          <div className="space-y-3">
            {activeSeasons.map((season) => (
              <StatsEntry
                key={season.id}
                href={buildStatisticsHref({
                  scope: {
                    scopeType: "season",
                    leagueId: season.leagueId,
                    seasonId: season.seasonId,
                    gameType: "all",
                  },
                  targetUserId: viewerUserId,
                  scopeLabel: `${season.leagueName} / ${season.seasonName}`,
                  returnTo: "/stats",
                })}
                title={season.seasonName}
                subtitle={`${season.leagueName}のシーズン成績`}
              />
            ))}
          </div>
        </Card>
      ) : null}

      <Card title="リーグ通算">
        {leagues.length > 0 ? (
          <div className="space-y-3">
            {leagues.map((league) => (
              <StatsEntry
                key={league.id}
                href={buildStatisticsHref({
                  scope: {
                    scopeType: "league",
                    leagueId: league.id,
                    gameType: "all",
                  },
                  targetUserId: viewerUserId,
                  scopeLabel: league.name,
                  returnTo: "/stats",
                })}
                title={league.name}
                subtitle="このリーグの全シーズン"
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            参加中のリーグはありません。
          </p>
        )}
      </Card>

      {otherSeasons.length > 0 ? (
        <Card title="参加したシーズン">
          <div className="space-y-3">
            {otherSeasons.map((season) => (
              <StatsEntry
                key={season.id}
                href={buildStatisticsHref({
                  scope: {
                    scopeType: "season",
                    leagueId: season.leagueId,
                    seasonId: season.seasonId,
                    gameType: "all",
                  },
                  targetUserId: viewerUserId,
                  scopeLabel: `${season.leagueName} / ${season.seasonName}`,
                  returnTo: "/stats",
                })}
                title={season.seasonName}
                subtitle={season.leagueName}
              />
            ))}
          </div>
        </Card>
      ) : null}

      <Card title="全リーグ・全期間">
        <div className="space-y-3">
          <StatsEntry
            href={buildStatisticsHref({
              scope: { scopeType: "overall", gameType: "sanma" },
              targetUserId: viewerUserId,
              scopeLabel: "全リーグ・全期間（三麻）",
              returnTo: "/stats",
            })}
            title="三麻の成績"
            subtitle="全リーグを対象にした成績"
          />
          <StatsEntry
            href={buildStatisticsHref({
              scope: { scopeType: "overall", gameType: "yonma" },
              targetUserId: viewerUserId,
              scopeLabel: "全リーグ・全期間（四麻）",
              returnTo: "/stats",
            })}
            title="四麻の成績"
            subtitle="全リーグを対象にした成績"
          />
        </div>
      </Card>
    </section>
  );
};
