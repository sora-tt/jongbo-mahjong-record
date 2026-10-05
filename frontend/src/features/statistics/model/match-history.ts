import { formatStatisticsTrendDateTime } from "./trend";

import type { StatisticsMatchHistoryResponse } from "../api";

export type StatisticsMatchHistoryView = StatisticsMatchHistoryResponse & {
  targetUserId: string;
};

export type StatisticsMatchHistoryUiStatus =
  | "idle"
  | "loading"
  | "ready"
  | "empty"
  | "uncomputed"
  | "error";

type ReadyHistory = Extract<
  StatisticsMatchHistoryResponse,
  { status: "ready" }
>;
type MatchHistoryItem = ReadyHistory["items"][number];

export type StatisticsMatchHistoryDisplayItem = MatchHistoryItem & {
  playedAtLabel: string;
};

export const getStatisticsMatchHistoryModel = (input: {
  status: StatisticsMatchHistoryUiStatus;
  history: StatisticsMatchHistoryView | null;
}) => {
  const readyHistory =
    input.status === "ready" && input.history?.status === "ready"
      ? input.history
      : null;

  return {
    status: input.status,
    items: readyHistory
      ? readyHistory.items.map((item) => ({
          ...item,
          playedAtLabel: formatStatisticsTrendDateTime(item.match.playedAt),
        }))
      : ([] as StatisticsMatchHistoryDisplayItem[]),
    nextCursor: readyHistory?.nextCursor ?? null,
  };
};
