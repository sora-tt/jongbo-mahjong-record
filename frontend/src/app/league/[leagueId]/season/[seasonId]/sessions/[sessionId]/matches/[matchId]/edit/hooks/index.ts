import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import {
  toMatchFormValues,
  validateMatchForm,
  type MatchFormValues,
} from "@/features/session-match/model/match-form";
import { getParticipantConstraint } from "@/features/session-match/model/participants";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";
import { fetchLeagueDetail } from "@/lib/api/leagues";
import { getMatch, updateMatch } from "@/lib/api/matches";
import { fetchSessionDetail } from "@/lib/api/sessions";

const DEFAULT_ERROR_MESSAGE =
  "対局編集画面の取得に失敗しました。時間をおいて再度お試しください。";
const DEFAULT_SUBMIT_ERROR_MESSAGE =
  "対局結果の更新に失敗しました。入力内容を確認して再度お試しください。";

export const useEditMatchPage = () => {
  const router = useRouter();
  const params = useParams<{
    leagueId: string;
    seasonId: string;
    sessionId: string;
    matchId: string;
  }>();
  const [members, setMembers] = React.useState<
    Awaited<ReturnType<typeof fetchSessionDetail>>["members"]
  >([]);
  const [constraint, setConstraint] = React.useState(() =>
    getParticipantConstraint("yonma")
  );
  const [startingPoints, setStartingPoints] = React.useState<number | null>(
    null
  );
  const [values, setValues] = React.useState<MatchFormValues | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  React.useEffect(() => {
    let isActive = true;
    const { leagueId, seasonId, sessionId, matchId } = params;
    if (!leagueId || !seasonId || !sessionId || !matchId) {
      setError("必要なIDが指定されていません");
      setIsLoading(false);
      return;
    }
    const load = async () => {
      setIsLoading(true);
      setError(null);
      setValues(null);
      try {
        const [league, session, match] = await Promise.all([
          fetchLeagueDetail(leagueId),
          fetchSessionDetail({ leagueId, seasonId, sessionId }),
          getMatch({ leagueId, seasonId, sessionId, matchId }),
        ]);
        if (!isActive) return;
        setMembers(session.members);
        setConstraint(getParticipantConstraint(league.rule.gameType));
        setStartingPoints(league.rule.oka.startingPoints);
        setValues(toMatchFormValues(match));
      } catch (loadError) {
        if (!isActive) return;
        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace("/login");
          return;
        }
        setError(getApiErrorMessage(loadError, DEFAULT_ERROR_MESSAGE));
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    void load();
    return () => {
      isActive = false;
    };
  }, [
    params,
    params.leagueId,
    params.seasonId,
    params.sessionId,
    params.matchId,
    retryCount,
    router,
  ]);

  const handleSubmit = React.useCallback(async () => {
    const { leagueId, seasonId, sessionId, matchId } = params;
    if (
      !leagueId ||
      !seasonId ||
      !sessionId ||
      !matchId ||
      !values ||
      startingPoints === null
    ) {
      setError(DEFAULT_ERROR_MESSAGE);
      return;
    }
    const validation = validateMatchForm({
      values,
      constraint,
      allowedMembers: members,
      startingPoints,
    });
    if (validation.message || !validation.results) {
      setError(validation.message ?? DEFAULT_SUBMIT_ERROR_MESSAGE);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await updateMatch({
        leagueId,
        seasonId,
        sessionId,
        matchId,
        playedAt: values.playedAt,
        results: validation.results,
      });
      router.push(
        `/league/${leagueId}/season/${seasonId}/sessions/${sessionId}/results`
      );
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        router.replace("/login");
        return;
      }
      setError(getApiErrorMessage(submitError, DEFAULT_SUBMIT_ERROR_MESSAGE));
    } finally {
      setIsSubmitting(false);
    }
  }, [constraint, members, params, router, startingPoints, values]);

  const handleBack = React.useCallback(() => {
    const { leagueId, seasonId, sessionId } = params;
    if (leagueId && seasonId && sessionId) {
      router.push(
        `/league/${leagueId}/season/${seasonId}/sessions/${sessionId}/results`
      );
    } else {
      router.push("/");
    }
  }, [params, router]);

  return {
    values,
    setValues,
    constraint,
    members,
    isLoading,
    isSubmitting,
    error,
    retry: () => setRetryCount((count) => count + 1),
    handleSubmit,
    handleBack,
  };
};
