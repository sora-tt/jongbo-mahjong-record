import type {
  CreateSessionInput,
  Session,
  UpdateSessionInput,
} from "@/domain/models.js";

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
