import type { SeasonMember } from "@/domain/season/types.js";
import type {
  IsoDateString,
  LeagueId,
  Nullable,
  SeasonId,
  SessionId,
  UserId,
} from "@/domain/shared/types.js";

export type Session = {
  id: SessionId;
  leagueId: LeagueId;
  seasonId: SeasonId;
  startedAt: IsoDateString;
  endedAt: Nullable<IsoDateString>;
  members: SeasonMember[];
  memberCount: number;
  totalMatchCount: number;
  tableLabel: Nullable<string>;
  createdBy: UserId;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};
