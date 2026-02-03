import { ColorState } from "./color";

import { AppDate } from "@/types/utils/app-date";

export type UserBase = {
  userId: UserIdType;
  name: string;
};

export type User = UserBase & {
  email: string;
  createdAt: AppDate;
  color: ColorState;
};

export type UserIdType = string;
