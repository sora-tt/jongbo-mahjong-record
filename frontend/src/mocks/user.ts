import type { User } from "@/types/domain/user";

import { AppDate } from "@/types/utils/app-date";

export const userData1: User = {
  userId: "0001",
  name: "岩田",
  email: "iwata@mail",
  createdAt: AppDate.fromYMD({
    year: 2000,
    month: 10,
    day: 3,
  }),
  color: "emerald",
};

export const userData2: User = {
  userId: "0002",
  name: "富田",
  email: "tomita@mail",
  createdAt: AppDate.fromYMD({
    year: 2000,
    month: 9,
    day: 30,
  }),
  color: "emerald",
};

export const userData3: User = {
  userId: "0003",
  name: "野口",
  email: "noguchi@mail",
  createdAt: AppDate.fromYMD({
    year: 2000,
    month: 7,
    day: 28,
  }),
  color: "emerald",
};

export const userData4: User = {
  userId: "0004",
  name: "梶",
  email: "kaji@mail",
  createdAt: AppDate.fromYMD({
    year: 2000,
    month: 10,
    day: 4,
  }),
  color: "emerald",
};

export const userData5: User = {
  userId: "0005",
  name: "川上",
  email: "kawakami@mail",
  createdAt: AppDate.fromYMD({
    year: 1999,
    month: 4,
    day: 13,
  }),
  color: "green",
};

export const userData6: User = {
  userId: "0006",
  name: "水島",
  email: "mizushima@mail",
  createdAt: AppDate.fromYMD({
    year: 2001,
    month: 9,
    day: 11,
  }),
  color: "yellow",
};

export const userData7: User = {
  userId: "0007",
  name: "佐伯",
  email: "saeki@mail",
  createdAt: AppDate.fromYMD({
    year: 2000,
    month: 2,
    day: 17,
  }),
  color: "red",
};

export const userData8: User = {
  userId: "0008",
  name: "吉見",
  email: "yoshimi@mail",
  createdAt: AppDate.fromYMD({
    year: 2002,
    month: 9,
    day: 27,
  }),
  color: "blue",
};

export const userData9: User = {
  userId: "0009",
  name: "梶本",
  email: "kajimoto@mail",
  createdAt: AppDate.fromYMD({
    year: 2000,
    month: 10,
    day: 4,
  }),
  color: "emerald",
};
