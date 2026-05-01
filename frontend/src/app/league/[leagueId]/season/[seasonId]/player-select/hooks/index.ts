import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import { ApiError } from "@/lib/api/core";
import { fetchSeasonDetail } from "@/lib/api/seasons";
import { useAppDispatch } from "@/store/hooks";
import { setRecordingFlow } from "@/store/slices/recording-flow-slice";

import { type Props as DropdownProps } from "@/components/ui/dropdown";

import type { PlayerSelectOption } from "@/types/domain/player-select";

const DEFAULT_ERROR_MESSAGE =
  "プレイヤー選択画面の取得に失敗しました。時間をおいて再度お試しください。";

const INITIAL_PLAYERS = {
  first: "",
  second: "",
  third: "",
  fourth: "",
};

export const usePlayerSelect = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useParams<{ leagueId: string; seasonId: string }>();
  const [seasonName, setSeasonName] = React.useState("");
  const [options, setOptions] = React.useState<PlayerSelectOption[]>([]);
  const [players, setPlayers] = React.useState(INITIAL_PLAYERS);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isActive = true;

    const leagueId = params.leagueId;
    const seasonId = params.seasonId;

    if (!leagueId || !seasonId) {
      setError("leagueId または seasonId が指定されていません");
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const season = await fetchSeasonDetail(leagueId, seasonId);

        if (!isActive) {
          return;
        }

        setSeasonName(season.name);
        setOptions(
          season.members.map((member) => ({
            label: member.userName,
            value: member.userId,
          }))
        );
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
  }, [params.leagueId, params.seasonId, router]);

  const handlePlayerChange = React.useCallback(
    (position: keyof typeof INITIAL_PLAYERS): DropdownProps["onChange"] =>
      (_, value) => {
        setPlayers((prev) => ({
          ...prev,
          [position]: value,
        }));
        setError(null);
      },
    []
  );

  const getPositionOptions = React.useCallback(
    (position: keyof typeof INITIAL_PLAYERS) => {
      const selectedIds = new Set(
        (Object.keys(INITIAL_PLAYERS) as Array<keyof typeof INITIAL_PLAYERS>)
          .filter((currentPosition) => currentPosition !== position)
          .map((currentPosition) => players[currentPosition])
          .filter(Boolean)
      );

      return options.filter(
        (option) =>
          option.value === players[position] || !selectedIds.has(option.value)
      );
    },
    [options, players]
  );

  const firstOptions = React.useMemo(
    () => getPositionOptions("first"),
    [getPositionOptions]
  );
  const secondOptions = React.useMemo(
    () => getPositionOptions("second"),
    [getPositionOptions]
  );
  const thirdOptions = React.useMemo(
    () => getPositionOptions("third"),
    [getPositionOptions]
  );
  const fourthOptions = React.useMemo(
    () => getPositionOptions("fourth"),
    [getPositionOptions]
  );

  const selectedPlayerIds = Object.values(players).filter(Boolean);
  const hasDuplicatePlayers =
    new Set(selectedPlayerIds).size !== selectedPlayerIds.length;
  const canSubmit =
    selectedPlayerIds.length >= 3 &&
    selectedPlayerIds.length <= 4 &&
    !hasDuplicatePlayers;

  const handleSubmit = React.useCallback(() => {
    const leagueId = params.leagueId;
    const seasonId = params.seasonId;

    if (!leagueId || !seasonId) {
      setError("leagueId または seasonId が指定されていません");
      return;
    }

    if (!canSubmit) {
      setError("プレイヤーは重複なしで3〜4人選択してください");
      return;
    }

    setIsSubmitting(true);

    dispatch(
      setRecordingFlow({
        leagueId,
        seasonId,
        selectedPlayerIds,
        selectedPlayersBySeat: {
          east: players.first,
          south: players.second,
          west: players.third,
          north: players.fourth,
        },
        sessionId: null,
      })
    );

    router.push(`/league/${leagueId}/season/${seasonId}/matches/new`);
  }, [
    canSubmit,
    dispatch,
    params.leagueId,
    params.seasonId,
    router,
    selectedPlayerIds,
    players,
  ]);

  const handleBack = React.useCallback(() => {
    const leagueId = params.leagueId;
    const seasonId = params.seasonId;

    if (!leagueId || !seasonId) {
      router.push("/");
      return;
    }

    router.push(`/league/${leagueId}/season/${seasonId}`);
  }, [params.leagueId, params.seasonId, router]);

  return {
    seasonName,
    players,
    options,
    isLoading,
    isSubmitting,
    error,
    canSubmit,
    onFirstPlayerChange: handlePlayerChange("first"),
    onSecondPlayerChange: handlePlayerChange("second"),
    onThirdPlayerChange: handlePlayerChange("third"),
    onFourthPlayerChange: handlePlayerChange("fourth"),
    firstOptions,
    secondOptions,
    thirdOptions,
    fourthOptions,
    handleSubmit,
    handleBack,
  };
};
