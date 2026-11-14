import * as React from "react";

import { ArrowRight, Pencil, Trophy } from "lucide-react";

import Link from "next/link";

import { buildStatisticsHref } from "@/features/statistics/model/page";

import { ButtonLink } from "@/components/v2/ui/button-link";
import { Card } from "@/components/v2/ui/card";
import { Chip } from "@/components/v2/ui/chip";
import { IconContainer } from "@/components/v2/ui/icon-container";
import { LinkLoadingIndicator } from "@/components/v2/ui/link-loading-indicator";

import type { toLeagueSummary } from "@/features/league/model/adapter";

export const LeagueCard = ({
  league,
  userId,
}: {
  league: ReturnType<typeof toLeagueSummary>;
  userId: string;
}) => {
  const points = league.myStanding?.totalPoints;
  return (
    <Card as="article" size="sm" className="relative">
      <Link
        href={`/v2/league/${league.id}`}
        aria-label={`${league.name}のリーグ詳細`}
        className="absolute inset-0 rounded-v2-panel"
      >
        <LinkLoadingIndicator />
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <IconContainer size="md" circle>
            <Trophy
              size={19}
              className="text-v2-text-secondary"
              aria-hidden="true"
            />
          </IconContainer>
          <div>
            <h3 className="font-bold">{league.name}</h3>
            <p className="text-v2-caption text-v2-text-secondary">
              {league.memberCount}人 · {league.totalMatchCount}局
            </p>
          </div>
        </div>
        <Chip variant={league.activeSeason ? "selected" : "neutral"} size="sm">
          {league.activeSeason ? "開催中" : "シーズンなし"}
        </Chip>
      </div>
      <div className="mt-3">
        <p className="text-[10px] text-v2-text-secondary">ACTIVE SEASON</p>
        <p className="text-v2-label font-semibold">
          {league.activeSeason?.name ?? "開催中のシーズンはありません"}
        </p>
      </div>
      <div className="mt-2 grid grid-cols-2">
        <div>
          <p className="text-v2-caption text-v2-text-secondary">順位</p>
          <p className="font-bold">
            {league.myStanding?.rank != null
              ? `${league.myStanding.rank}位`
              : "集計待ち"}
          </p>
        </div>
        <div>
          <p className="text-v2-caption text-v2-text-secondary">ポイント</p>
          <p
            className={
              points == null
                ? "font-bold text-v2-text-secondary"
                : points < 0
                  ? "font-bold text-v2-danger"
                  : "font-bold text-v2-success"
            }
          >
            {points == null
              ? "—"
              : `${points > 0 ? "+" : ""}${points.toFixed(1)} pt`}
          </p>
        </div>
      </div>
      <div className="pointer-events-none relative z-10 mt-4 flex flex-wrap items-center justify-end gap-2">
        {league.activeSeason && userId && (
          <ButtonLink
            variant="tertiary"
            size="sm"
            className="pointer-events-auto mr-auto whitespace-nowrap !gap-1 !border-0 !px-0 !text-v2-caption !font-normal underline-offset-2 hover:underline"
            trailingIcon={<ArrowRight size={14} aria-hidden="true" />}
            href={buildStatisticsHref({
              routePrefix: "/v2",
              scope: {
                scopeType: "season",
                leagueId: league.id,
                seasonId: league.activeSeason.id,
                gameType: "all",
              },
              targetUserId: userId,
              scopeLabel: `${league.name} / ${league.activeSeason.name}`,
              returnTo: "/v2",
            })}
          >
            今シーズンの成績
          </ButtonLink>
        )}
        {league.activeSeason && (
          <>
            <ButtonLink
              href={`/v2/league/${league.id}/season/${league.activeSeason.id}`}
              variant="secondary"
              size="sm"
              className="pointer-events-auto !px-3"
              trailingIcon={<ArrowRight size={16} aria-hidden="true" />}
            >
              詳細
            </ButtonLink>
            <ButtonLink
              href={`/v2/league/${league.id}/season/${league.activeSeason.id}/sessions/start/players`}
              size="sm"
              className="pointer-events-auto !px-3"
              trailingIcon={<Pencil size={16} aria-hidden="true" />}
            >
              記録
            </ButtonLink>
          </>
        )}
      </div>
    </Card>
  );
};
