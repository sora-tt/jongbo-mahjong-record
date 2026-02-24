import { useDailyRecord } from "@/app/daily-record/hooks";

export const useDailyRecordTable = () => {
  const { players, matches, totals } = useDailyRecord();

  return { players, matches, totals };
};
