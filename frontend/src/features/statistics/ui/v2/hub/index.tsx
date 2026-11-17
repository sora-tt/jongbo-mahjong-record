import * as React from "react";

import { ChevronDown, ChevronRight } from "lucide-react";

import Link from "next/link";

import { buildStatisticsHref } from "@/features/statistics/model/page";

import { ErrorState } from "@/components/v2/ui/error-state";
import { LoadingState } from "@/components/v2/ui/loading-state";
import { Panel } from "@/components/v2/ui/panel";

type Season = {
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
const Entry = ({
  href,
  title,
  subtitle,
}: {
  href: string;
  title: string;
  subtitle: string;
}) => (
  <Link
    href={href}
    className="flex min-h-[76px] items-center justify-between gap-3 border-b border-v2-border-subtle py-3 last:border-0"
  >
    <span className="min-w-0">
      <span className="block font-bold text-v2-text">{title}</span>
      <span className="mt-1 block text-v2-caption text-v2-text-secondary">
        {subtitle}
      </span>
    </span>
    <ChevronRight
      size={20}
      className="shrink-0 text-v2-text-secondary"
      aria-hidden="true"
    />
  </Link>
);
const Group = ({
  title,
  children,
}: React.PropsWithChildren<{ title: string }>) => (
  <Panel>
    <h2 className="text-v2-heading-2 font-bold">{title}</h2>
    {children}
  </Panel>
);
export const StatisticsHub = ({
  viewerUserId,
  seasons,
  leagues,
  status,
  onRetry,
}: {
  viewerUserId: string;
  seasons: readonly Season[];
  leagues: readonly League[];
  status: "loading" | "ready" | "error";
  onRetry: () => void;
}) => {
  if (status === "loading")
    return <LoadingState label="成績を読み込んでいます" className="min-h-40" />;
  if (status === "error")
    return (
      <ErrorState
        message="参加中のリーグを表示できません。"
        onRetry={onRetry}
      />
    );
  const seasonHref = (season: Season) =>
    buildStatisticsHref({
      routePrefix: "/v2",
      scope: {
        scopeType: "season",
        leagueId: season.leagueId,
        seasonId: season.seasonId,
        gameType: "all",
      },
      targetUserId: viewerUserId,
      scopeLabel: `${season.leagueName} / ${season.seasonName}`,
      returnTo: "/v2/stats",
    });
  // シーズンのデータだけが残っている場合も、成績への入口を維持する。
  const leagueGroups = [
    ...leagues,
    ...Array.from(
      new Map(
        seasons
          .filter(
            (season) => !leagues.some((league) => league.id === season.leagueId)
          )
          .map((season) => [
            season.leagueId,
            {
              id: season.leagueId,
              name: season.leagueName,
              activeSeason: null,
            },
          ])
      ).values()
    ),
  ];
  return (
    <section className="space-y-4">
      <header className="pb-1 text-center">
        <h1 className="text-v2-display font-bold">成績</h1>
      </header>
      {leagueGroups.length ? (
        leagueGroups.map((league) => {
          const leagueSeasons = seasons.filter(
            (season) => season.leagueId === league.id
          );
          const currentSeasons = leagueSeasons.filter(
            (season) => season.seasonId === league.activeSeason?.id
          );
          const pastSeasons = leagueSeasons.filter(
            (season) => season.seasonId !== league.activeSeason?.id
          );
          return (
            <Group key={league.id} title={league.name}>
              <Entry
                href={buildStatisticsHref({
                  routePrefix: "/v2",
                  scope: {
                    scopeType: "league",
                    leagueId: league.id,
                    gameType: "all",
                  },
                  targetUserId: viewerUserId,
                  scopeLabel: league.name,
                  returnTo: "/v2/stats",
                })}
                title="リーグ通算"
                subtitle="このリーグの全シーズン"
              />
              {currentSeasons.map((season) => (
                <Entry
                  key={season.id}
                  href={seasonHref(season)}
                  title={season.seasonName}
                  subtitle="進行中のシーズン"
                />
              ))}
              {pastSeasons.length > 0 && (
                <details className="group">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 text-v2-caption font-bold text-v2-text-secondary [&::-webkit-details-marker]:hidden">
                    過去のシーズン（{pastSeasons.length}）
                    <ChevronDown
                      size={20}
                      className="shrink-0 transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  {pastSeasons.map((season) => (
                    <Entry
                      key={season.id}
                      href={seasonHref(season)}
                      title={season.seasonName}
                      subtitle="シーズン成績"
                    />
                  ))}
                </details>
              )}
            </Group>
          );
        })
      ) : (
        <Group title="リーグ">
          <p className="mt-3 text-v2-caption text-v2-text-secondary">
            参加中のリーグはありません。
          </p>
        </Group>
      )}
      <Group title="全リーグ・全期間">
        {(
          [
            ["sanma", "三麻"],
            ["yonma", "四麻"],
          ] as const
        ).map(([gameType, label]) => (
          <Entry
            key={gameType}
            href={buildStatisticsHref({
              routePrefix: "/v2",
              scope: { scopeType: "overall", gameType },
              targetUserId: viewerUserId,
              scopeLabel: `全リーグ・全期間（${label}）`,
              returnTo: "/v2/stats",
            })}
            title={`${label}の成績`}
            subtitle="全リーグを対象にした成績"
          />
        ))}
      </Group>
    </section>
  );
};
