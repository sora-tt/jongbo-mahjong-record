import type { SeasonMember } from "@/domain/season/types.js";

export type Session = {
  id: string;
  leagueId: string;
  seasonId: string;
  startedAt: string;
  endedAt: string | null;
  members: SeasonMember[];
  memberCount: number;
  totalMatchCount: number;
  tableLabel: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};
