import { ColorState } from "./color";
import { AppDate } from "../utils/app-date";

export type User = {
  userId: UserIdType;
  name: string;
  email: string;
  createdAt: AppDate;
  color: ColorState;
};

export type UserIdType = string;
