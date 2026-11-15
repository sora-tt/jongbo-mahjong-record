import * as React from "react";

import Link from "next/link";

import { buildStatisticsHref } from "@/features/statistics/model/page";

import { Chip } from "@/components/v2/ui/chip";

import type { ApiLeague } from "@/lib/api/contracts";

type Props = {
  members: readonly { userId: string; userName: string }[];
  league: {
    id: string;
    name: string;
    rule: { gameType: ApiLeague["rule"]["gameType"] };
  };
};

export const LeagueMembers = ({ members, league }: Props) => (
  <div className="-my-2 flex flex-wrap gap-x-2">
    {members.map((member) => (
      <Link
        key={String(member.userId)}
        href={buildStatisticsHref({
          routePrefix: "/v2",
          scope: {
            scopeType: "league",
            leagueId: String(league.id),
            gameType: league.rule.gameType,
          },
          targetUserId: String(member.userId),
          scopeLabel: league.name,
          returnTo: `/v2/league/${league.id}`,
        })}
        aria-label={`${member.userName}の成績`}
        title={member.userName}
        className="flex min-h-11 w-[calc(3em+1.5rem)] shrink-0 items-center rounded-full text-v2-caption"
      >
        <Chip size="sm" className="w-full min-w-0">
          <span className="truncate">{member.userName}</span>
        </Chip>
      </Link>
    ))}
  </div>
);
