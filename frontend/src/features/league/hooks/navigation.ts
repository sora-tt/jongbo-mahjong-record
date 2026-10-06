"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { fetchLeagues } from "@/features/league/api";
import { toLeagueSummary } from "@/features/league/model/adapter";
import { fetchLeagueSeasons } from "@/features/season/api";
import { toSeasonSummary } from "@/features/season/model/adapter";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";

import type {
  LeagueNavigationItem,
  NavigationLink,
  NavigationLoadState,
} from "@/components/layout/navigation/types";

const INITIAL_LEAGUE_STATE: NavigationLoadState<LeagueNavigationItem> = {
  status: "idle",
  items: [],
};

const toLoadState = <T>(items: T[]): NavigationLoadState<T> => {
  if (items.length === 0) {
    return { status: "empty", items: [] };
  }

  const first = items[0]!;
  return { status: "ready", items: [first, ...items.slice(1)] };
};

const toSeasonLink = (
  season: ReturnType<typeof toSeasonSummary>
): NavigationLink => ({
  id: season.id,
  label: season.name,
  href: `/league/${season.leagueId}/season/${season.id}`,
});

export const useLeagueNavigation = () => {
  const router = useRouter();
  const [leagues, setLeagues] =
    React.useState<NavigationLoadState<LeagueNavigationItem>>(
      INITIAL_LEAGUE_STATE
    );
  const leaguesRef =
    React.useRef<NavigationLoadState<LeagueNavigationItem>>(leagues);
  const leagueRequestId = React.useRef(0);
  const seasonRequestIds = React.useRef(new Map<string, number>());
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      leagueRequestId.current += 1;
    };
  }, []);

  const commitLeagues = React.useCallback(
    (next: NavigationLoadState<LeagueNavigationItem>) => {
      leaguesRef.current = next;
      setLeagues(next);
    },
    []
  );

  const setSeasonState = React.useCallback(
    (leagueId: string, seasons: NavigationLoadState<NavigationLink>) => {
      const current = leaguesRef.current;
      const items = current.items.map((league) =>
        league.id === leagueId ? { ...league, seasons } : league
      );
      if (!items.some((league) => league.id === leagueId)) {
        return;
      }

      if (current.status === "ready") {
        commitLeagues({
          status: "ready",
          items: [items[0]!, ...items.slice(1)],
        });
        return;
      }

      if (current.status === "error") {
        commitLeagues({ status: "error", items, message: current.message });
        return;
      }

      if (current.status === "empty") {
        commitLeagues({ status: "empty", items: [] });
        return;
      }

      commitLeagues({ status: current.status, items });
    },
    [commitLeagues]
  );

  const loadLeagueList = React.useCallback(
    async (force = false) => {
      const previous = leaguesRef.current;
      if (!force && previous.status !== "idle") {
        return;
      }

      const requestId = ++leagueRequestId.current;
      commitLeagues({ status: "loading", items: previous.items });

      try {
        const leagueDtos = await fetchLeagues();
        if (!isMounted.current || requestId !== leagueRequestId.current) {
          return;
        }

        const latestItemsById = new Map(
          leaguesRef.current.items.map((league) => [league.id, league])
        );
        const items = leagueDtos.map((dto) => {
          const league = toLeagueSummary(dto);
          return {
            id: league.id,
            label: league.name,
            href: `/league/${league.id}`,
            seasons:
              latestItemsById.get(league.id)?.seasons ??
              ({ status: "idle", items: [] } as const),
          };
        });
        commitLeagues(toLoadState(items));
      } catch (loadError) {
        if (!isMounted.current || requestId !== leagueRequestId.current) {
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace("/login");
        }
        commitLeagues({
          status: "error",
          items: leaguesRef.current.items,
          message: getApiErrorMessage(
            loadError,
            "リーグ一覧を読み込めませんでした。"
          ),
        });
      }
    },
    [commitLeagues, router]
  );

  const loadSeasonList = React.useCallback(
    async (leagueId: string, force = false) => {
      const league = leaguesRef.current.items.find(
        (item) => item.id === leagueId
      );
      if (!league || (!force && league.seasons.status !== "idle")) {
        return;
      }

      const requestId = (seasonRequestIds.current.get(leagueId) ?? 0) + 1;
      seasonRequestIds.current.set(leagueId, requestId);
      setSeasonState(leagueId, {
        status: "loading",
        items: league.seasons.items,
      });

      try {
        const seasons = await fetchLeagueSeasons(leagueId);
        if (
          !isMounted.current ||
          seasonRequestIds.current.get(leagueId) !== requestId
        ) {
          return;
        }

        const items = seasons.map((season) =>
          toSeasonLink(toSeasonSummary(season))
        );
        setSeasonState(leagueId, toLoadState(items));
      } catch (loadError) {
        if (
          !isMounted.current ||
          seasonRequestIds.current.get(leagueId) !== requestId
        ) {
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace("/login");
        }
        setSeasonState(leagueId, {
          status: "error",
          items: league.seasons.items,
          message: getApiErrorMessage(
            loadError,
            `${league.label}のシーズン一覧を読み込めませんでした。`
          ),
        });
      }
    },
    [router, setSeasonState]
  );

  const loadLeagues = React.useCallback(() => {
    void loadLeagueList();
  }, [loadLeagueList]);

  const retryLeagues = React.useCallback(() => {
    void loadLeagueList(true);
  }, [loadLeagueList]);

  const loadSeasons = React.useCallback(
    (leagueId: string) => {
      void loadSeasonList(leagueId);
    },
    [loadSeasonList]
  );

  const retrySeasons = React.useCallback(
    (leagueId: string) => {
      void loadSeasonList(leagueId, true);
    },
    [loadSeasonList]
  );

  return { leagues, loadLeagues, retryLeagues, loadSeasons, retrySeasons };
};
