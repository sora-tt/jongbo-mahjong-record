import type { User } from "@/types/domain/user";

import { User as TempUser } from "@/types/domain";

export const mockUser: TempUser = {
  name: "テストユーザー",
  email: "test@test.com",
  createdAt: new Date(2020, 1, 1),
};

export const userData1: User = {
  id: "0001",
  name: "岩田",
  email: "iwata@mail",
  createdAt: new Date(2000, 9, 3)
  color: "red",
};

export const userData2: User = {
  id: "0002",
  name: "富田",
  email: "tomita@mail",
  createdAt: new Date(2000, 8, 30),
  color: "blue",
};

export const userData3: User = {
  id: "0003",
  name: "野口",
  email: "noguchi@mail",
  createdAt: new Date(2000, 6, 28),
  color: "orange",
};

export const userData4: User = {
  id: "0004",
  name: "梶",
  email: "kaji@mail",
  createdAt: new Date(2000, 9, 4),
  color: "pink",
};
