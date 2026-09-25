import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import {
  getParticipantConstraint,
  type GameType,
  type Wind,
  validateParticipants,
} from "@/features/session-match/model/participants";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";
import { fetchLeagueDetail } from "@/lib/api/leagues";
import { fetchSeasonDetail } from "@/lib/api/seasons";
import { useAppDispatch } from "@/store/hooks";
import { setRecordingFlow } from "@/store/slices/recording-flow-slice";

import { type Props as DropdownProps } from "@/components/ui/dropdown";

import type {
  PlayerSelectOption,
  SelectedPlayers,
} from "@/types/domain/player-select";

const DEFAULT_ERROR_MESSAGE =
  "プレイヤー候補の取得に失敗しました。時間をおいて再度お試しください。";

const EMPTY_PLAYERS: SelectedPlayers = {
  east: "",
  south: "",
  west: "",
  north: "",
};

export const usePlayerSelect = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useParams<{ leagueId: string; seasonId: string }>();
  const [seasonName, setSeasonName] = React.useState("");
  const [gameType, setGameType] = React.useState<GameType>("yonma");
  const [options, setOptions] = React.useState<PlayerSelectOption[]>([]);
  const [seasonMembers, setSeasonMembers] = React.useState<
    Awaited<ReturnType<typeof fetchSeasonDetail>>["members"]
  >([]);
  const [players, setPlayers] = React.useState<SelectedPlayers>(EMPTY_PLAYERS);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  React.useEffect(() => {
    let isActive = true;
    const { leagueId, seasonId } = params;

    if (!leagueId || !seasonId) {
      setError("leagueId または seasonId が指定されていません");
      setIsLoading(false);
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

        setSeasonName(season.name);
        setGameType(league.rule.gameType);
        setSeasonMembers(season.members);
        setOptions(
          season.members.map((member) => ({
            label: member.userName,
            value: String(member.userId),
          }))
        );
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
  }, [params, params.leagueId, params.seasonId, retryCount, router]);

  const constraint = React.useMemo(
    () => getParticipantConstraint(gameType),
    [gameType]
  );

  const getPositionOptions = React.useCallback(
    (wind: Wind) => {
      const selectedIds = new Set(
        constraint.requiredWinds
          .filter((currentWind) => currentWind !== wind)
          .map((currentWind) => players[currentWind])
          .filter(Boolean)
      );
      return options.filter(
        (option) =>
          option.value === players[wind] || !selectedIds.has(option.value)
      );
    },
    [constraint.requiredWinds, options, players]
  );

  const validationMessage = React.useMemo(
    () =>
      validateParticipants({
        constraint,
        participants: {
          east: players.east || null,
          south: players.south || null,
          west: players.west || null,
          north: players.north || null,
        },
        allowedMembers: seasonMembers,
      }),
    [constraint, players, seasonMembers]
  );

  const handlePlayerChange = React.useCallback(
    (wind: Wind): DropdownProps["onChange"] =>
      (_, value) => {
        setPlayers((current) => ({ ...current, [wind]: value }));
        setError(null);
      },
    []
  );

  const handleSubmit = React.useCallback(() => {
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    const { leagueId, seasonId } = params;
    if (!leagueId || !seasonId) {
      setError("leagueId または seasonId が指定されていません");
      return;
    }

    setIsSubmitting(true);
    dispatch(
      setRecordingFlow({
        leagueId,
        seasonId,
        selectedPlayerIds: constraint.requiredWinds.map(
          (wind) => players[wind]
        ),
        selectedPlayersBySeat: players,
        sessionId: null,
      })
    );
    router.push(`/league/${leagueId}/season/${seasonId}/sessions/start/match`);
  }, [
    constraint.requiredWinds,
    dispatch,
    params,
    players,
    router,
    validationMessage,
  ]);

  return {
    seasonName,
    gameType,
    requiredWinds: constraint.requiredWinds,
    players,
    options,
    isLoading,
    isSubmitting,
    error,
    canSubmit:
      !validationMessage && seasonMembers.length >= constraint.memberCount,
    retry: () => setRetryCount((count) => count + 1),
    getPositionOptions,
    onPlayerChange: handlePlayerChange,
    handleSubmit,
    handleBack: () => {
      if (params.leagueId && params.seasonId) {
        router.push(`/league/${params.leagueId}/season/${params.seasonId}`);
      } else {
        router.push("/");
      }
    },
    hasCandidates: options.length >= constraint.memberCount,
  };
};
