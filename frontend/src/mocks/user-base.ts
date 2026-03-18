import type { UserBase, UserIdType } from "@/types/domain/user";

export const userBaseData1: UserBase = {
  userId: "0001",
  name: "岩田",
};

export const userBaseData2: UserBase = {
  userId: "0002",
  name: "富田",
};

export const userBaseData3: UserBase = {
  userId: "0003",
  name: "野口",
};

export const userBaseData4: UserBase = {
  userId: "0004",
  name: "梶",
};

export const userBaseData5: UserBase = {
  userId: "0005",
  name: "川上",
};

export const userBaseData6: UserBase = {
  userId: "0006",
  name: "水島",
};

export const userBaseData7: UserBase = {
  userId: "0007",
  name: "佐伯",
};

export const userBaseData8: UserBase = {
  userId: "0008",
  name: "吉見",
};

export const userBaseData9: UserBase = {
  userId: "0009",
  name: "梶本",
};

export const userBaseListData: Record<UserIdType, UserBase> = {
  [userBaseData1.userId]: userBaseData1,
  [userBaseData2.userId]: userBaseData2,
  [userBaseData3.userId]: userBaseData3,
  [userBaseData4.userId]: userBaseData4,
  [userBaseData5.userId]: userBaseData5,
  [userBaseData6.userId]: userBaseData6,
  [userBaseData7.userId]: userBaseData7,
  [userBaseData8.userId]: userBaseData8,
  [userBaseData9.userId]: userBaseData9,
};
