import type { Session } from "@/domain/session/types.js";

export type CreateSessionInput = {
  startedAt: string;
  endedAt?: string | null;
  memberUserIds: string[];
  tableLabel?: string | null;
  createdBy: string;
};

export type UpdateSessionInput = {
  endedAt?: string | null;
  tableLabel?: string | null;
};

export interface SessionRepository {
  list(leagueId: string, seasonId: string): Promise<Session[]>;
  get(leagueId: string, seasonId: string, sessionId: string): Promise<Session>;
  create(
    leagueId: string,
    seasonId: string,
    input: CreateSessionInput,
    members: Session["members"],
  ): Promise<Session>;
  update(
    leagueId: string,
    seasonId: string,
    sessionId: string,
    input: UpdateSessionInput,
  ): Promise<Session>;
  delete(leagueId: string, seasonId: string, sessionId: string): Promise<void>;
  setTotalMatchCount(
    leagueId: string,
    seasonId: string,
    sessionId: string,
    totalMatchCount: number,
  ): Promise<void>;
}
