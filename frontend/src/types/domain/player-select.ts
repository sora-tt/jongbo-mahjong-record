import type { Wind } from "./match";

export type PlayerSeat = Lowercase<Wind>;

export type PlayerSelectOption = {
  label: string;
  value: string;
};

export type SelectedPlayers = Record<PlayerSeat, string>;

export type RecordingFlowState = {
  leagueId: string | null;
  seasonId: string | null;
  selectedPlayerIds: string[];
  selectedPlayersBySeat: SelectedPlayers;
  sessionId: string | null;
};
