import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import { ApiError } from "@/lib/api/core";
import { fetchLeagueDetail } from "@/lib/api/leagues";
import { deleteMatch, fetchMatches } from "@/lib/api/matches";
import { fetchSessionDetail, updateSession } from "@/lib/api/sessions";
import { useAppDispatch } from "@/store/hooks";
import { clearRecordingFlow } from "@/store/slices/recording-flow-slice";

import type {
  DailyRecordTableMatch,
  DailyRecordTablePlayer,
} from "@/components/pages/daily-record/daily-record-table";

const DEFAULT_ERROR_MESSAGE =
  "本日の成績の取得に失敗しました。時間をおいて再度お試しください。";
const DEFAULT_DELETE_ERROR_MESSAGE =
  "対局結果の削除に失敗しました。時間をおいて再度お試しください。";
const DEFAULT_END_ERROR_MESSAGE =
  "記録の終了に失敗しました。時間をおいて再度お試しください。";

const WIND_MAP = {
  east: "EAST",
  south: "SOUTH",
  west: "WEST",
  north: "NORTH",
} as const;

type ApiMatch = Awaited<ReturnType<typeof fetchMatches>>[number];

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));

const formatRule = (rule: {
  gameType: "sanma" | "yonma";
  oka: {
    startingPoints: number;
    returnPoints: number;
  };
}) => {
  const gameTypeLabel = rule.gameType === "yonma" ? "四麻" : "三麻";
  const starting = rule.oka.startingPoints.toLocaleString();
  const returns = rule.oka.returnPoints.toLocaleString();
  return `${gameTypeLabel} ${starting}点持ち ${returns}点返し`;
};

const toTableMatch = (match: ApiMatch): DailyRecordTableMatch => {
  const matchResultInput: DailyRecordTableMatch["results"]["matchResultInput"] =
    {
      EAST: null,
      SOUTH: null,
      WEST: null,
      NORTH: null,
    };

  match.results.forEach((result) => {
    matchResultInput[WIND_MAP[result.wind]] = {
      player: {
        userId: result.userId,
        name: result.userName,
      },
      score: result.point,
      rank: result.rank,
    };
  });

  return {
    matchId: match.id,
    results: {
      matchResultInput,
    },
  };
};

export const useSessionResultsPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useParams<{
    leagueId: string;
    seasonId: string;
    sessionId: string;
  }>();
  const leagueId = params.leagueId;
  const seasonId = params.seasonId;
  const sessionId = params.sessionId;
  const [date, setDate] = React.useState("");
  const [rule, setRule] = React.useState("");
  const [players, setPlayers] = React.useState<DailyRecordTablePlayer[]>([]);
  const [matches, setMatches] = React.useState<DailyRecordTableMatch[]>([]);
  const [totals, setTotals] = React.useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEnding, setIsEnding] = React.useState(false);
  const [deletingMatchId, setDeletingMatchId] = React.useState<string | null>(
    null
  );
  const [deleteTargetMatchId, setDeleteTargetMatchId] = React.useState<
    string | null
  >(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(
    async (options?: { showLoading?: boolean }) => {
      if (!leagueId || !seasonId || !sessionId) {
        setError(
          "leagueId、seasonId、sessionId のいずれかが指定されていません"
        );
        setIsLoading(false);
        return;
      }

      if (options?.showLoading ?? true) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const [league, session, fetchedMatches] = await Promise.all([
          fetchLeagueDetail(leagueId),
          fetchSessionDetail({ leagueId, seasonId, sessionId }),
          fetchMatches({ leagueId, seasonId, sessionId }),
        ]);

        setDate(formatDate(session.startedAt));
        setRule(formatRule(league.rule));
        setPlayers(
          session.members.map((member) => ({
            userId: member.userId,
            name: member.userName,
          }))
        );
        setMatches(fetchedMatches.map(toTableMatch));
        setTotals(
          fetchedMatches.reduce<Record<string, number>>((acc, match) => {
            match.results.forEach((result) => {
              acc[result.userId] = (acc[result.userId] ?? 0) + result.point;
            });
            return acc;
          }, {})
        );
      } catch (loadError) {
        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace("/login");
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : DEFAULT_ERROR_MESSAGE
        );
      } finally {
        setIsLoading(false);
      }
    },
    [leagueId, router, seasonId, sessionId]
  );

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleAddRecord = React.useCallback(() => {
    if (!leagueId || !seasonId || !sessionId) {
      return;
    }

    router.push(
      `/league/${leagueId}/season/${seasonId}/sessions/${sessionId}/matches/new`
    );
  }, [leagueId, router, seasonId, sessionId]);

  const handleEditMatch = React.useCallback(
    (matchId: string) => {
      if (!leagueId || !seasonId || !sessionId) {
        return;
      }

      router.push(
        `/league/${leagueId}/season/${seasonId}/sessions/${sessionId}/matches/${matchId}/edit`
      );
    },
    [leagueId, router, seasonId, sessionId]
  );

  const handleEndRecord = React.useCallback(async () => {
    if (!leagueId || !seasonId || !sessionId) {
      return;
    }

    setIsEnding(true);
    setError(null);

    try {
      await updateSession({
        leagueId,
        seasonId,
        sessionId,
        endedAt: new Date().toISOString(),
      });
      dispatch(clearRecordingFlow());
      router.push(`/league/${leagueId}/season/${seasonId}`);
    } catch (endError) {
      if (endError instanceof ApiError && endError.status === 401) {
        router.replace("/login");
        return;
      }

      setError(
        endError instanceof Error ? endError.message : DEFAULT_END_ERROR_MESSAGE
      );
    } finally {
      setIsEnding(false);
    }
  }, [dispatch, leagueId, router, seasonId, sessionId]);

  const handleRequestDeleteMatch = React.useCallback((matchId: string) => {
    setDeleteTargetMatchId(matchId);
  }, []);

  const handleCancelDeleteMatch = React.useCallback(() => {
    setDeleteTargetMatchId(null);
  }, []);

  const handleConfirmDeleteMatch = React.useCallback(
    async (matchId: string) => {
      if (!leagueId || !seasonId || !sessionId) {
        return;
      }

      setDeletingMatchId(matchId);
      setError(null);

      try {
        await deleteMatch({ leagueId, seasonId, sessionId, matchId });
        setDeleteTargetMatchId(null);
        await load({ showLoading: false });
      } catch (deleteError) {
        if (deleteError instanceof ApiError && deleteError.status === 401) {
          router.replace("/login");
          return;
        }

        setError(
          deleteError instanceof Error
            ? deleteError.message
            : DEFAULT_DELETE_ERROR_MESSAGE
        );
      } finally {
        setDeletingMatchId(null);
      }
    },
    [leagueId, load, router, seasonId, sessionId]
  );

  return {
    date,
    rule,
    players,
    matches,
    totals,
    isLoading,
    isEnding,
    deletingMatchId,
    deleteTargetMatchId,
    error,
    handleAddRecord,
    handleEditMatch,
    handleEndRecord,
    handleRequestDeleteMatch,
    handleCancelDeleteMatch,
    handleConfirmDeleteMatch,
  };
};
