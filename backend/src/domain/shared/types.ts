export type GameType = "sanma" | "yonma";
export type SeasonStatus = "active" | "archived";
export type ScopeType = "overall" | "league" | "season";
export type Wind = "east" | "south" | "west" | "north";

declare const opaqueIdBrand: unique symbol;
declare const isoDateStringBrand: unique symbol;

/** API/Domainでは値の形式を公開せず、永続層の文書IDを不透明値として扱う。 */
export type OpaqueId = string & {
  readonly [opaqueIdBrand]: "OpaqueId";
};

/** API/Domainの日時。Firestore TimestampはRepository境界の内側だけで扱う。 */
export type IsoDateString = string & {
  readonly [isoDateStringBrand]: "IsoDateString";
};

export type Nullable<T> = T | null;

export type UserId = OpaqueId;
export type LeagueId = OpaqueId;
export type SeasonId = OpaqueId;
export type SessionId = OpaqueId;
export type MatchId = OpaqueId;
export type UserStatsId = OpaqueId;

export type UserReference = {
  userId: UserId;
  userName: string;
};

export type ActiveSeasonSummary = {
  id: SeasonId;
  name: string;
};

export const asOpaqueId = (value: string): OpaqueId => {
  if (value.length === 0) {
    throw new TypeError("opaque id must not be empty");
  }

  return value as OpaqueId;
};

export const asIsoDateString = (value: string): IsoDateString => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError("invalid ISO 8601 date string");
  }

  return date.toISOString() as IsoDateString;
};

export type RecordHolder = {
  value: number;
  userId: UserId;
  userName: string;
};
