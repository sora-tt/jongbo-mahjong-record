import { HomeVm } from "@/types/view/home";

export const mockHomeVm: HomeVm = {
  userName: "野口",
  leagues: [
    {
      id: "uuid-1",
      name: "Tリーグ",
      memberCount: 8,
      gameCount: 20,
      myRank: 2,
    },
    {
      id: "uuid-2",
      name: "Mリーグ",
      memberCount: 6,
      gameCount: 12,
      myRank: 4,
    },
  ],
};
