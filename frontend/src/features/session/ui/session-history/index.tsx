import * as React from "react";

import { ChevronRight } from "lucide-react";

import Link from "next/link";

import type { toSessionList } from "@/features/session/model/adapter";

type Session = ReturnType<typeof toSessionList>[number];

const formatHistoryDate = (value: string | null) => {
  if (!value) return "未記録";
  const parts = new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("month")}月${get("day")}日（${get("weekday")}）`;
};

export const SessionHistory = ({
  sessions,
  leagueId,
  seasonId,
}: {
  sessions: readonly Session[];
  leagueId: string;
  seasonId: string;
}) => (
  <ul>
    {sessions.map((session) => {
      const sessionId = String(session.id);
      return (
        <li
          key={sessionId}
          className="relative border-b border-app-border-subtle last:border-0"
        >
          <Link
            href={`/league/${leagueId}/season/${seasonId}/sessions/${session.id}/results`}
            className="flex min-h-[78px] items-center gap-2 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-app-label font-bold text-app-text">
                  {formatHistoryDate(session.startedAt)}
                </span>
                <span className="text-[13px] font-medium text-app-text-secondary">
                  {session.totalMatchCount}局
                </span>
              </div>
              <p className="mt-1 text-[13px] text-app-text-secondary">
                {session.members.map((member) => member.userName).join("、")}
              </p>
              <span className="sr-only">
                {session.endedAt ? "終了" : "進行中"}、参加者{" "}
                {session.memberCount}人
                {session.tableLabel ? `、卓 ${session.tableLabel}` : ""}
              </span>
            </div>
            <ChevronRight
              size={24}
              strokeWidth={1.75}
              className="shrink-0 text-app-text-secondary"
              aria-hidden="true"
            />
          </Link>
        </li>
      );
    })}
  </ul>
);
