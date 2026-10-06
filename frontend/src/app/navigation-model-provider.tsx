"use client";

import * as React from "react";

import { useLeagueNavigation } from "@/features/league/hooks/navigation";
import { buildStatisticsHref } from "@/features/statistics/model/page";
import { useAuth } from "@/providers/auth-provider";

import { HeaderNavigationModelContext } from "@/components/layout/navigation/context";
import type {
  HeaderNavigationModel,
  NavigationLink,
} from "@/components/layout/navigation/types";

const STATISTICS_LINKS: readonly NavigationLink[] = [
  {
    id: "sanma",
    label: "三麻",
    href: buildStatisticsHref({
      scope: { scopeType: "overall", gameType: "sanma" },
    }),
  },
  {
    id: "yonma",
    label: "四麻",
    href: buildStatisticsHref({
      scope: { scopeType: "overall", gameType: "yonma" },
    }),
  },
];

export const NavigationModelProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { user } = useAuth();

  return (
    <NavigationModelState key={user?.uid ?? "anonymous"}>
      {children}
    </NavigationModelState>
  );
};

const NavigationModelState: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const leagueNavigation = useLeagueNavigation();
  const [expandedSection, setExpandedSection] =
    React.useState<HeaderNavigationModel["expandedSection"]>(null);
  const [expandedLeagueIds, setExpandedLeagueIds] = React.useState<string[]>(
    []
  );

  const toggleSection = React.useCallback(
    (section: NonNullable<HeaderNavigationModel["expandedSection"]>) => {
      setExpandedSection((current) => (current === section ? null : section));
    },
    []
  );
  const toggleLeague = React.useCallback((leagueId: string) => {
    setExpandedLeagueIds((current) =>
      current.includes(leagueId)
        ? current.filter((item) => item !== leagueId)
        : [...current, leagueId]
    );
  }, []);

  const model = React.useMemo<HeaderNavigationModel>(
    () => ({
      ...leagueNavigation,
      statistics: STATISTICS_LINKS,
      expandedSection,
      toggleSection,
      expandedLeagueIds,
      toggleLeague,
    }),
    [
      expandedLeagueIds,
      expandedSection,
      leagueNavigation,
      toggleLeague,
      toggleSection,
    ]
  );

  return (
    <HeaderNavigationModelContext.Provider value={model}>
      {children}
    </HeaderNavigationModelContext.Provider>
  );
};
