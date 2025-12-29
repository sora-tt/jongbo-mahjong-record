import { ColorState } from "./color";
import { AppDate } from "../utils/app-date";

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: AppDate;
  color: ColorState;
};
