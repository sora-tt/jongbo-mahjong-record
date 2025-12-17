import type { User } from "@/types/domain/user";

import { User as TempUser } from "@/types/domain";

export const mockUser: TempUser = {
  name: "テストユーザー",
  email: "test@test.com",
  createdAt: new Date(2020, 1, 1),
};

export const userData1: User = {
  id: "aaaaaa",
  name: "野口",
  email: "tatsuya.noguchi@gmail.com",
  createdAt: new Date(2025, 0, 1),
  color: "red",
};

export const userData2: User = {
  id: "bbbbbb",
  name: "岩田",
  email: "kinya.iwata@gmail.com",
  createdAt: new Date(2025, 0, 1),
  color: "blue",
};

export const userData3: User = {
  id: "cccccc",
  name: "富田",
  email: "sora.tomita@gmail.com",
  createdAt: new Date(2025, 0, 1),
  color: "orange",
};

export const userData4: User = {
  id: "dddddd",
  name: "梶",
  email: "shoma.kaji@gmail.com",
  createdAt: new Date(2025, 0, 1),
  color: "pink",
};
