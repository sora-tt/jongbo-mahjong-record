import { ColorState } from "./color";

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  color: ColorState;
};
