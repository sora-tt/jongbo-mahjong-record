/** A link prepared by the owning feature or app composition layer. */
export type NavigationLink = Readonly<{
  id: string;
  label: string;
  href: string;
}>;

/** Display state for a lazily loaded navigation list. */
export type NavigationLoadState<T> =
  | Readonly<{ status: "idle"; items: readonly T[] }>
  | Readonly<{ status: "loading"; items: readonly T[] }>
  | Readonly<{ status: "ready"; items: readonly [T, ...T[]] }>
  | Readonly<{ status: "empty"; items: readonly [] }>
  | Readonly<{ status: "error"; items: readonly T[]; message: string }>;

/** A league link with its independently loaded season links. */
export type LeagueNavigationItem = NavigationLink &
  Readonly<{
    seasons: NavigationLoadState<NavigationLink>;
  }>;

export type HeaderNavigationSection = "leagues" | "statistics";

/** Display contract consumed by Header; it contains no API or route logic. */
export type HeaderNavigationModel = Readonly<{
  leagues: NavigationLoadState<LeagueNavigationItem>;
  statistics: readonly NavigationLink[];
  /** The open top-level submenu, or null when both submenus are closed. */
  expandedSection: HeaderNavigationSection | null;
  /** Opens the selected submenu or closes it when it is already open. */
  toggleSection: (section: HeaderNavigationSection) => void;
  /** League IDs whose season lists are currently expanded. */
  expandedLeagueIds: readonly string[];
  /** Toggles the season list for the selected league. */
  toggleLeague: (leagueId: string) => void;
  loadLeagues: () => void;
  retryLeagues: () => void;
  loadSeasons: (leagueId: string) => void;
  retrySeasons: (leagueId: string) => void;
}>;
