import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import {
  createEmptyMatchFormValues,
  validateMatchForm,
  type MatchFormValues,
} from "@/features/session-match/model/match-form";
import {
  getParticipantConstraint,
  membersToParticipants,
} from "@/features/session-match/model/participants";
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
        setMembers(session.members);
        setConstraint(getParticipantConstraint(league.rule.gameType));
        setStartingPoints(league.rule.oka.startingPoints);
        setValues({
          ...createEmptyMatchFormValues(),
          userIdByWind: membersToParticipants(session.members),
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
    ready,
    handleSubmit,
    handleBack,
  };
};
