import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import { ApiError } from "@/lib/api/core";
import { fetchLeagueDetail } from "@/lib/api/leagues";
import { fetchMatches, updateMatch } from "@/lib/api/matches";
import { fetchSeasonDetail } from "@/lib/api/seasons";
import { fetchSessionDetail } from "@/lib/api/sessions";

import { type Props as DropdownProps } from "@/components/ui/dropdown";

import type {
  PlayerSelectOption,
  SelectedPlayers,
} from "@/types/domain/player-select";

const DEFAULT_ERROR_MESSAGE =
  "対局編集画面の取得に失敗しました。時間をおいて再度お試しください。";
const DEFAULT_SUBMIT_ERROR_MESSAGE =
  "対局結果の更新に失敗しました。時間をおいて再度お試しください。";

const SCORE_POSITIONS = ["first", "second", "third", "fourth"] as const;

const WIND_BY_POSITION = {
  first: "east",
  second: "south",
  third: "west",
  fourth: "north",
} as const;

type ScorePosition = (typeof SCORE_POSITIONS)[number];
type ScoreState = Record<ScorePosition, string>;

const INITIAL_SCORES: ScoreState = {
  first: "",
  second: "",
  third: "",
  fourth: "",
};

const EMPTY_SELECTED_PLAYERS: SelectedPlayers = {
  east: "",
  south: "",
  west: "",
  north: "",
};

const parseScore = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) {
    return null;
  }

  return parsed * 100;
};

const buildRanks = (
  rows: Array<{ position: ScorePosition; rawScore: number }>
) => {
  const sorted = [...rows].sort(
    (left, right) => right.rawScore - left.rawScore
  );

  return sorted.reduce(
    (acc, row, index) => {
      const previous = sorted[index - 1];
      acc[row.position] =
        index === 0 || previous.rawScore !== row.rawScore
          ? index + 1
          : acc[previous.position];
      return acc;
    },
    {} as Record<ScorePosition, number>
  );
};

export const useEditMatchPage = () => {
  const router = useRouter();
  const params = useParams<{
    leagueId: string;
    seasonId: string;
    sessionId: string;
    matchId: string;
  }>();
  const [options, setOptions] = React.useState<PlayerSelectOption[]>([]);
  const [players, setPlayers] = React.useState<SelectedPlayers>(
    EMPTY_SELECTED_PLAYERS
  );
  const [scores, setScores] = React.useState<ScoreState>(INITIAL_SCORES);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [startingPoints, setStartingPoints] = React.useState<number | null>(
    null
  );

  React.useEffect(() => {
    let isActive = true;

    const { leagueId, seasonId, sessionId, matchId } = params;

    if (!leagueId || !seasonId || !sessionId || !matchId) {
      setError(
        "leagueId、seasonId、sessionId、matchId のいずれかが指定されていません"
      );
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [season, league, session, matches] = await Promise.all([
          fetchSeasonDetail(leagueId, seasonId),
          fetchLeagueDetail(leagueId),
          fetchSessionDetail({ leagueId, seasonId, sessionId }),
          fetchMatches({ leagueId, seasonId, sessionId }),
        ]);
        const targetMatch = matches.find((match) => match.id === matchId);

        if (!isActive) {
          return;
        }

        if (!targetMatch) {
          setError("編集対象の対局結果が見つかりません");
          return;
        }

        const memberNameByUserId = new Map(
          season.members.map((member) => [member.userId, member.userName])
        );
        setOptions(
          session.members.map((member) => ({
            label: memberNameByUserId.get(member.userId) ?? member.userName,
            value: member.userId,
          }))
        );
        setStartingPoints(league.rule.oka.startingPoints);

        const nextPlayers = { ...EMPTY_SELECTED_PLAYERS };
        const nextScores = { ...INITIAL_SCORES };

        targetMatch.results.forEach((result) => {
          const scorePosition = SCORE_POSITIONS.find(
            (position) => WIND_BY_POSITION[position] === result.wind
          );
          nextPlayers[result.wind] = result.userId;
          if (scorePosition) {
            nextScores[scorePosition] = String(result.rawScore / 100);
          }
        });

        setPlayers(nextPlayers);
        setScores(nextScores);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace("/login");
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : DEFAULT_ERROR_MESSAGE
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [params, router]);

  const swapPlayers = React.useCallback(
    (position: keyof SelectedPlayers): DropdownProps["onChange"] =>
      (_, value) => {
        setPlayers((prev) => {
          const next = { ...prev };
          const previousValue = next[position];
          const duplicatePosition = (
            Object.keys(next) as Array<keyof SelectedPlayers>
          ).find((key) => key !== position && next[key] === value);

          next[position] = value;

          if (duplicatePosition) {
            next[duplicatePosition] = previousValue;
          }

          return next;
        });
        setError(null);
      },
    []
  );

  const handleScoreChange =
    (position: ScorePosition) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setScores((prev) => ({ ...prev, [position]: e.target.value }));
      setError(null);
    };

  const handleSubmit = React.useCallback(async () => {
    const { leagueId, seasonId, sessionId, matchId } = params;

    if (!leagueId || !seasonId || !sessionId || !matchId) {
      setError(
        "leagueId、seasonId、sessionId、matchId のいずれかが指定されていません"
      );
      return;
    }

    const parsedRows = SCORE_POSITIONS.map((position) => {
      const wind = WIND_BY_POSITION[position];
      const userId = players[wind];

      if (!userId) {
        return null;
      }

      return {
        position,
        userId,
        wind,
        rawScore: parseScore(scores[position]),
      };
    }).filter(
      (
        row
      ): row is {
        position: ScorePosition;
        userId: string;
        wind: "east" | "south" | "west" | "north";
        rawScore: number | null;
      } => row !== null
    );

    if (parsedRows.some((row) => row.rawScore === null)) {
      setError("全員分の点数を整数で入力してください");
      return;
    }

    if (startingPoints === null) {
      setError(DEFAULT_ERROR_MESSAGE);
      return;
    }

    const rowsWithScores = parsedRows as Array<
      (typeof parsedRows)[number] & { rawScore: number }
    >;
    const expectedRawTotal = startingPoints * rowsWithScores.length;
    const rawTotal = rowsWithScores.reduce((sum, row) => sum + row.rawScore, 0);

    if (rawTotal !== expectedRawTotal) {
      setError(
        `合計点数は ${expectedRawTotal.toLocaleString()} 点になるよう入力してください`
      );
      return;
    }

    const ranks = buildRanks(
      rowsWithScores.map((row) => ({
        position: row.position,
        rawScore: row.rawScore,
      }))
    );

    setIsSubmitting(true);
    setError(null);

    try {
      await updateMatch({
        leagueId,
        seasonId,
        sessionId,
        matchId,
        results: rowsWithScores.map((row) => ({
          userId: row.userId,
          wind: row.wind,
          rank: ranks[row.position],
          rawScore: row.rawScore,
        })),
      });

      router.push(
        `/league/${leagueId}/season/${seasonId}/sessions/${sessionId}/results`
      );
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        router.replace("/login");
        return;
      }

      setError(
        submitError instanceof Error
          ? submitError.message
          : DEFAULT_SUBMIT_ERROR_MESSAGE
      );
      setIsSubmitting(false);
    }
  }, [params, players, router, scores, startingPoints]);

  const handleBack = React.useCallback(() => {
    const { leagueId, seasonId, sessionId } = params;

    if (!leagueId || !seasonId || !sessionId) {
      router.push("/");
      return;
    }

    router.push(
      `/league/${leagueId}/season/${seasonId}/sessions/${sessionId}/results`
    );
  }, [params, router]);

  return {
    players,
    options,
    scores,
    isLoading,
    isSubmitting,
    error,
    onEastPlayerChange: swapPlayers("east"),
    onSouthPlayerChange: swapPlayers("south"),
    onWestPlayerChange: swapPlayers("west"),
    onNorthPlayerChange: swapPlayers("north"),
    handleScoreChange,
    handleSubmit,
    handleBack,
  };
};
