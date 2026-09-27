import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import {
  createEmptyMatchFormValues,
  validateMatchForm,
  type MatchFormValues,
} from "@/features/session-match/model/match-form";
import {
  getParticipantConstraint,
  type ParticipantConstraint,
} from "@/features/session-match/model/participants";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";
import { fetchLeagueDetail } from "@/lib/api/leagues";
import { createMatch } from "@/lib/api/matches";
import { fetchSeasonDetail } from "@/lib/api/seasons";
import { createSession, deleteSession } from "@/lib/api/sessions";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectRecordingFlow } from "@/store/selectors/recording-flow-selectors";
import { clearRecordingFlow } from "@/store/slices/recording-flow-slice";

const DEFAULT_ERROR_MESSAGE =
  "対局記録画面の取得に失敗しました。時間をおいて再度お試しください。";
const DEFAULT_SUBMIT_ERROR_MESSAGE =
  "対局の保存に失敗しました。入力内容を確認して再度お試しください。";

export const useRecordMatchPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useParams<{ leagueId: string; seasonId: string }>();
  const recordingFlow = useAppSelector(selectRecordingFlow);
  const isNavigatingAfterSubmitRef = React.useRef(false);
  const [members, setMembers] = React.useState<
    Awaited<ReturnType<typeof fetchSeasonDetail>>["members"]
  >([]);
  const [constraint, setConstraint] = React.useState<ParticipantConstraint>(
    getParticipantConstraint("yonma")
  );
  const [startingPoints, setStartingPoints] = React.useState<number | null>(
    null
  );
  const [values, setValues] = React.useState<MatchFormValues>(() => {
    const initial = createEmptyMatchFormValues();
    return {
      ...initial,
      userIdByWind: {
        east: recordingFlow.selectedPlayersBySeat.east || null,
        south: recordingFlow.selectedPlayersBySeat.south || null,
        west: recordingFlow.selectedPlayersBySeat.west || null,
        north: recordingFlow.selectedPlayersBySeat.north || null,
      },
    };
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isNavigatingAfterSubmitRef.current) return;

    let isActive = true;
    const { leagueId, seasonId } = params;

    if (!leagueId || !seasonId || recordingFlow.selectedPlayerIds.length < 3) {
      router.replace(
        leagueId && seasonId
          ? `/league/${leagueId}/season/${seasonId}/sessions/start/players`
          : "/"
      );
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [league, season] = await Promise.all([
          fetchLeagueDetail(leagueId),
          fetchSeasonDetail(leagueId, seasonId),
        ]);
        if (!isActive) return;

        const nextConstraint = getParticipantConstraint(league.rule.gameType);
        const selectedIds = new Set(recordingFlow.selectedPlayerIds);
        const selectedMembers = season.members.filter((member) =>
          selectedIds.has(String(member.userId))
        );
        if (selectedMembers.length !== nextConstraint.memberCount) {
          setError(
            "Sessionの参加者を正しく取得できませんでした。前の画面から選び直してください。"
          );
          return;
        }

        setMembers(selectedMembers);
        setConstraint(nextConstraint);
        setStartingPoints(league.rule.oka.startingPoints);
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
    recordingFlow.selectedPlayerIds,
    router,
  ]);

  const handleSubmit = React.useCallback(async () => {
    const { leagueId, seasonId } = params;
    if (!leagueId || !seasonId || startingPoints === null) {
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
    let createdSessionId: string | null = null;

    try {
      const session = await createSession(leagueId, seasonId, {
        startedAt: new Date().toISOString(),
        memberUserIds: validation.results.map((result) => result.userId),
        tableLabel: null,
      });
      createdSessionId = String(session.id);

      await createMatch({
        leagueId,
        seasonId,
        sessionId: createdSessionId,
        playedAt: values.playedAt,
        results: validation.results,
      });

      isNavigatingAfterSubmitRef.current = true;
      dispatch(clearRecordingFlow());
      router.push(
        `/league/${leagueId}/season/${seasonId}/sessions/${createdSessionId}/results`
      );
    } catch (submitError) {
      if (createdSessionId) {
        try {
          await deleteSession({
            leagueId,
            seasonId,
            sessionId: createdSessionId,
          });
        } catch {
          // 元のMatchエラーを優先して表示する
        }
      }

      if (submitError instanceof ApiError && submitError.status === 401) {
        router.replace("/login");
        return;
      }
      setError(getApiErrorMessage(submitError, DEFAULT_SUBMIT_ERROR_MESSAGE));
    } finally {
      setIsSubmitting(false);
    }
  }, [constraint, dispatch, members, params, router, startingPoints, values]);

  const handleBack = React.useCallback(() => {
    if (params.leagueId && params.seasonId) {
      router.push(
        `/league/${params.leagueId}/season/${params.seasonId}/sessions/start/players`
      );
    } else {
      router.push("/");
    }
  }, [params.leagueId, params.seasonId, router]);

  return {
    values,
    setValues,
    constraint,
    members,
    isLoading,
    isSubmitting,
    error,
    handleSubmit,
    handleBack,
  };
};
