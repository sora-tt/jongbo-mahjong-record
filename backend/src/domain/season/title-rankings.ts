import type { Match } from "@/domain/match/types.js";
import type { SeasonMember } from "@/domain/season/types.js";
import { buildSeasonAggregates } from "@/domain/shared/aggregation.js";
import type { GameType } from "@/domain/shared/types.js";

export const buildSeasonTitleRankings = (
  members: SeasonMember[],
  matches: Match[],
  gameType: GameType,
) => {
  const entries = buildSeasonAggregates(members, matches).filter(
    (entry) => entry.totalMatchCount > 0,
  );
  const yakumanCounts = new Map<string, number>();
  for (const match of matches) {
    for (const event of match.yakumanEvents ?? []) {
      yakumanCounts.set(
        event.winnerUserId,
        (yakumanCounts.get(event.winnerUserId) ?? 0) + 1,
      );
    }
  }

  const ranking = (valueFor: (entry: (typeof entries)[number]) => number) =>
    entries
      .map((entry) => ({
        userId: entry.userId,
        userName: entry.userName,
        value: valueFor(entry),
      }))
      .sort(
        (a, b) =>
          b.value - a.value ||
          a.userName.localeCompare(b.userName, "ja") ||
          a.userId.localeCompare(b.userId),
      );

  return {
    highestScore: ranking((entry) => entry.highestScore!),
    avoidLastRate:
      gameType === "yonma"
        ? ranking((entry) =>
            Number(
              (
                ((entry.totalMatchCount - entry.fourthCount) /
                  entry.totalMatchCount) *
                100
              ).toFixed(2),
            ),
          )
        : [],
    top2Rate: ranking((entry) =>
      Number(
        (
          ((entry.firstCount + entry.secondCount) / entry.totalMatchCount) *
          100
        ).toFixed(2),
      ),
    ),
    yakuman: ranking((entry) => yakumanCounts.get(entry.userId) ?? 0),
  };
};
