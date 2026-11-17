import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import {
  toMatchFormValues,
  validateMatchForm,
  type YakumanEntryError,
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

export const useEditMatchPage = (routePrefix = "") => {
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
  const [chomboPenaltyPoints, setChomboPenaltyPoints] = React.useState(0);
  const [allowOffTableKyotaku, setAllowOffTableKyotaku] = React.useState(false);
  const [values, setValues] = React.useState<MatchFormValues | null>(null);
  const [matchIndex, setMatchIndex] = React.useState("");
  const [initialMatchIndex, setInitialMatchIndex] = React.useState<
    number | null
  >(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [yakumanErrors, setYakumanErrors] = React.useState<YakumanEntryError[]>(
    []
  );
  const [retryCount, setRetryCount] = React.useState(0);

  const onValuesChange = React.useCallback((nextValues: MatchFormValues) => {
    setValues(nextValues);
    setYakumanErrors([]);
  }, []);

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
      setNotFound(false);
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
        setChomboPenaltyPoints(league.rule.chomboPenaltyPoints ?? 0);
        setAllowOffTableKyotaku(league.rule.allowOffTableKyotaku ?? false);
        setValues(toMatchFormValues(match));
        setMatchIndex(String(match.matchIndex));
        setInitialMatchIndex(match.matchIndex);
      } catch (loadError) {
        if (!isActive) return;
        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace(`${routePrefix}/login`);
          return;
        }
        if (loadError instanceof ApiError && loadError.status === 404) {
          setNotFound(true);
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
    routePrefix,
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
    const nextMatchIndex = Number(matchIndex);
    if (
      !/^[1-9]\d*$/.test(matchIndex) ||
      !Number.isSafeInteger(nextMatchIndex)
    ) {
      setError("対局番号は1以上の整数で入力してください。");
      return;
    }
    const validation = validateMatchForm({
      values,
      constraint,
      allowedMembers: members,
      startingPoints,
      allowOffTableKyotaku,
      mode: "edit",
    });
    if (validation.message || !validation.results) {
      setYakumanErrors(validation.yakumanErrors ?? []);
      setError(validation.message ?? DEFAULT_SUBMIT_ERROR_MESSAGE);
      return;
    }
    setYakumanErrors([]);
    setIsSubmitting(true);
    setError(null);
    try {
      await updateMatch({
        leagueId,
        seasonId,
        sessionId,
        matchId,
        ...(nextMatchIndex !== initialMatchIndex
          ? { matchIndex: nextMatchIndex }
          : {}),
        playedAt: values.playedAt,
        results: validation.results,
        chomboEvents: validation.chomboEvents,
        offTableKyotakuCount: validation.offTableKyotakuCount,
        yakumanEvents: validation.yakumanEvents,
      });
      router.push(
        `${routePrefix}/league/${leagueId}/season/${seasonId}/sessions/${sessionId}/results`
      );
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        router.replace(`${routePrefix}/login`);
        return;
      }
      if (
        submitError instanceof ApiError &&
        submitError.status === 409 &&
        submitError.details.matchIndex !== undefined
      ) {
        setError(
          "この対局番号は既に使われています。別の番号を入力してください。"
        );
        return;
      }
      setError(getApiErrorMessage(submitError, DEFAULT_SUBMIT_ERROR_MESSAGE));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    allowOffTableKyotaku,
    constraint,
    members,
    params,
    routePrefix,
    router,
    startingPoints,
    values,
    matchIndex,
    initialMatchIndex,
  ]);

  const handleBack = React.useCallback(() => {
    const { leagueId, seasonId, sessionId } = params;
    if (leagueId && seasonId && sessionId) {
      router.push(
        `${routePrefix}/league/${leagueId}/season/${seasonId}/sessions/${sessionId}/results`
      );
    } else {
      router.push(routePrefix || "/");
    }
  }, [params, routePrefix, router]);

  return {
    values,
    matchIndex,
    setMatchIndex,
    setValues,
    constraint,
    members,
    chomboPenaltyPoints,
    allowOffTableKyotaku,
    isLoading,
    notFound,
    isSubmitting,
    error,
    yakumanErrors,
    onValuesChange,
    retry: () => setRetryCount((count) => count + 1),
    handleSubmit,
    handleBack,
  };
};
