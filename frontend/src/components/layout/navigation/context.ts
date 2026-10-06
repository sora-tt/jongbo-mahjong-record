import * as React from "react";

import type { HeaderNavigationModel } from "@/components/layout/navigation/types";

const EMPTY_HEADER_NAVIGATION_MODEL: HeaderNavigationModel = {
  leagues: { status: "idle", items: [] },
  statistics: [],
  expandedSection: null,
  toggleSection: () => undefined,
  expandedLeagueIds: [],
  toggleLeague: () => undefined,
  loadLeagues: () => undefined,
  retryLeagues: () => undefined,
  loadSeasons: () => undefined,
  retrySeasons: () => undefined,
};

/** App composition supplies the feature data; Header only renders this model. */
export const HeaderNavigationModelContext = React.createContext(
  EMPTY_HEADER_NAVIGATION_MODEL
);
