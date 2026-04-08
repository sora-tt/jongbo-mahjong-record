import { ColorState } from "./color";
import { LeagueIdType } from "./league";
import { AppDate } from "../utils/app-date";

export type UserBase = {
  userId: UserIdType;
  name: string;
};

export type User = UserBase & {
  email: string;
  joiningLeagueIds?: LeagueIdType[];
  createdAt: AppDate;
  color: ColorState;
};

export type UserIdType = string;
