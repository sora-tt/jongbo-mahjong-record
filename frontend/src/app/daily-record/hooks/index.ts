import { dailyRecordData1 } from "@/mocks/daily-record";
import { leaguesData } from "@/mocks/league";

export const useDailyRecord = () => {
  const record = dailyRecordData1;

  const league = Object.values(leaguesData).find(
    (l) => l.leagueId === record.leagueId
  );

  const date = record.date.format("yyyy/MM/dd");

  if (!league) {
    return {
      date,
      rule: "",
    };
  }

  const rule = league.rule.name;

  return {
    date,
    rule,
  };
};
