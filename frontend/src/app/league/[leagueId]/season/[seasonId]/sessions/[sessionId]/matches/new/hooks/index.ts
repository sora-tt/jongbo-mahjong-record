import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import { listMatches } from "@/features/match/api";
import {
  createEmptyMatchFormValues,
  validateMatchForm,
  type MatchFormValues,
} from "@/features/session-match/model/match-form";
import {
  getParticipantConstraint,
  membersToParticipants,
} from "@/features/session-match/model/participants";
import {
  findLatestMatchByIndex,
  getNextSeatAssignment,
} from "@/features/session-match/model/seat-rotation";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";
import { fetchLeagueDetail } from "@/lib/api/leagues";
import { createMatch } from "@/lib/api/matches";
import { fetchSessionDetail } from "@/lib/api/sessions";

const DEFAULT_ERROR_MESSAGE =
  "Session情報の取得に失敗しました。時間をおいて再度お試しください。";
const DEFAULT_SUBMIT_ERROR_MESSAGE =
  "対局の追加に失敗しました。入力内容を確認して再度お試しください。";

export const useRecordMatchPage = () => {
  const router = useRouter();
  const params = useParams<{
    leagueId: string;
    seasonId: string;
    sessionId: string;
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
  const [values, setValues] = React.useState<MatchFormValues>(
    createEmptyMatchFormValues
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let isActive = true;
    const { leagueId, seasonId, sessionId } = params;
    if (!leagueId || !seasonId || !sessionId) {
      setError("leagueId、seasonId、sessionId のいずれかが指定されていません");
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);
      setReady(false);
      try {
        const [league, session] = await Promise.all([
          fetchLeagueDetail(leagueId),
          fetchSessionDetail({ leagueId, seasonId, sessionId }),
        ]);
        if (!isActive) return;

        let initialUserIdByWind: MatchFormValues["userIdByWind"] =
          membersToParticipants(session.members);
        if (league.rule.rotateSeatOrder) {
          const matches = await listMatches({
            leagueId,
            seasonId,
            sessionId,
          });
          if (!isActive) return;

          const latestMatch = findLatestMatchByIndex(matches);
          if (latestMatch) {
            const nextSeatAssignment = getNextSeatAssignment(
              league.rule.gameType,
              latestMatch
            );
            if (!nextSeatAssignment.ok) {
              setError(
                "前回の対局の席順を確認できません。対局結果を確認してください。"
              );
              return;
            }
            initialUserIdByWind = nextSeatAssignment.userIdByWind;
          }
        }

        setMembers(session.members);
        setConstraint(getParticipantConstraint(league.rule.gameType));
        setStartingPoints(league.rule.oka.startingPoints);
        setChomboPenaltyPoints(league.rule.chomboPenaltyPoints ?? 0);
        setAllowOffTableKyotaku(league.rule.allowOffTableKyotaku ?? false);
        setValues({
          ...createEmptyMatchFormValues(),
          userIdByWind: initialUserIdByWind,
        });
        setReady(true);
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
  }, [params, params.leagueId, params.seasonId, params.sessionId, router]);

  const handleSubmit = React.useCallback(async () => {
    const { leagueId, seasonId, sessionId } = params;
    if (!leagueId || !seasonId || !sessionId || startingPoints === null) {
      setError(DEFAULT_ERROR_MESSAGE);
      return;
    }
    const validation = validateMatchForm({
      values,
      constraint,
      allowedMembers: members,
      startingPoints,
      allowOffTableKyotaku,
      mode: "additional",
    });
    if (validation.message || !validation.results) {
      setError(validation.message ?? DEFAULT_SUBMIT_ERROR_MESSAGE);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createMatch({
        leagueId,
        seasonId,
        sessionId,
        playedAt: values.playedAt,
        results: validation.results,
        chomboEvents: validation.chomboEvents,
        offTableKyotakuCount: validation.offTableKyotakuCount,
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
  }, [
    allowOffTableKyotaku,
    constraint,
    members,
    params,
    router,
    startingPoints,
    values,
  ]);

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
    chomboPenaltyPoints,
    allowOffTableKyotaku,
    isLoading,
    isSubmitting,
    error,
    ready,
    handleSubmit,
    handleBack,
  };
};
