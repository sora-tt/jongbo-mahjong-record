import { mockDailyRecord } from "@/mocks/daily-record";
import { userData1 } from "@/mocks/user";

export const useDailyRecord = () => {
  const user = userData1;
  const record = mockDailyRecord;

  const error: string | null = null;

  return { user, record, error };
};
