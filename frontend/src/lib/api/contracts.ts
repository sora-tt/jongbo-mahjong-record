import { type InferRequestType, type InferResponseType } from "hono/client";

import type { AppApiClient } from "@/lib/api/core";

export type ApiErrorCode =
  | "validation_error"
  | "authentication_error"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "internal_error";

type AppClient = AppApiClient;
type UserMeGetRequest = AppClient["api"]["users"]["me"]["$get"];
type UserMePostRequest = AppClient["api"]["users"]["me"]["$post"];
type UserStatsRequest = AppClient["api"]["users"][":userId"]["stats"]["$get"];
type JoiningSeasonsRequest =
  AppClient["api"]["users"][":userId"]["joining-seasons"]["$get"];
type LeaguesGetRequest = AppClient["api"]["leagues"]["$get"];
type LeagueGetRequest = AppClient["api"]["leagues"][":leagueId"]["$get"];
type LeaguePostRequest = AppClient["api"]["leagues"]["$post"];
type LeaguePatchRequest = AppClient["api"]["leagues"][":leagueId"]["$patch"];
type SeasonGetRequest =
  AppClient["api"]["leagues"][":leagueId"]["seasons"][":seasonId"]["$get"];
type SeasonPostRequest =
  AppClient["api"]["leagues"][":leagueId"]["seasons"]["$post"];
type SessionGetRequest =
  AppClient["api"]["leagues"][":leagueId"]["seasons"][":seasonId"]["sessions"][":sessionId"]["$get"];
type SessionPostRequest =
  AppClient["api"]["leagues"][":leagueId"]["seasons"][":seasonId"]["sessions"]["$post"];
type SessionPatchRequest =
  AppClient["api"]["leagues"][":leagueId"]["seasons"][":seasonId"]["sessions"][":sessionId"]["$patch"];
type MatchesGetRequest =
  AppClient["api"]["leagues"][":leagueId"]["seasons"][":seasonId"]["sessions"][":sessionId"]["matches"]["$get"];

export type ApiUser = InferResponseType<UserMeGetRequest>["data"];
export type ApiUserStats = InferResponseType<UserStatsRequest>["data"];
export type ApiJoiningSeason =
  InferResponseType<JoiningSeasonsRequest>["data"][number];
export type ApiLeagueListItem =
  InferResponseType<LeaguesGetRequest>["data"][number];
export type ApiLeague = InferResponseType<LeagueGetRequest>["data"];
export type ApiSeason = InferResponseType<SeasonGetRequest>["data"];
export type ApiSession = InferResponseType<SessionGetRequest>["data"];
export type ApiMatch = InferResponseType<MatchesGetRequest>["data"][number];

export type CreateMeInput = InferRequestType<UserMePostRequest>["json"];
export type CreateLeagueInput = InferRequestType<LeaguePostRequest>["json"];
export type UpdateLeagueInput = InferRequestType<LeaguePatchRequest>["json"];
export type CreateSeasonInput = InferRequestType<SeasonPostRequest>["json"];
export type CreateSessionInput = InferRequestType<SessionPostRequest>["json"];
export type UpdateSessionInput = InferRequestType<SessionPatchRequest>["json"];
// The current Hono validator exposes this request body as unknown. Keep the
// shape aligned with backend/src/presentation/schemas/match.ts until the
// validator publishes an inferred input type.
export type MatchResultInput = Array<{
  userId: string;
  wind: "east" | "south" | "west" | "north";
  rank: number;
  rawScore: number;
}>;

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type UserId = Brand<string, "UserId">;
export type LeagueId = Brand<string, "LeagueId">;
export type SeasonId = Brand<string, "SeasonId">;
export type SessionId = Brand<string, "SessionId">;
export type MatchId = Brand<string, "MatchId">;
export type IsoDateTime = Brand<string, "IsoDateTime">;

export const toId = <T extends string>(value: unknown, name: string): T => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} must be a non-empty string`);
  }

  return value as T;
};

export const toIsoDateTime = (value: unknown): IsoDateTime => {
  if (
    typeof value !== "string" ||
    Number.isNaN(Date.parse(value)) ||
    !value.includes("T")
  ) {
    throw new Error("Expected an ISO 8601 datetime");
  }

  return value as IsoDateTime;
};
