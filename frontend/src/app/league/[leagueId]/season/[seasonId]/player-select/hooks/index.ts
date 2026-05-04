import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import { ApiError } from "@/lib/api/core";
import { fetchSeasonDetail } from "@/lib/api/seasons";
import { useAppDispatch } from "@/store/hooks";
import { setRecordingFlow } from "@/store/slices/recording-flow-slice";

import { type Props as DropdownProps } from "@/components/ui/dropdown";

import type {
  PlayerSeat,
  PlayerSelectOption,
  SelectedPlayers,
} from "@/types/domain/player-select";

const DEFAULT_ERROR_MESSAGE =
  "プレイヤー選択画面の取得に失敗しました。時間をおいて再度お試しください。";

const PLAYER_SEATS: PlayerSeat[] = ["east", "south", "west", "north"];

const INITIAL_PLAYERS: SelectedPlayers = {
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
    (seat: PlayerSeat): DropdownProps["onChange"] =>
      (_, value) => {
        setPlayers((prev) => ({
          ...prev,
          [seat]: value,
        }));
        setError(null);
      },
    []
  );

  const getPositionOptions = React.useCallback(
    (seat: PlayerSeat) => {
      const selectedIds = new Set(
        PLAYER_SEATS.filter((currentSeat) => currentSeat !== seat)
          .map((currentSeat) => players[currentSeat])
          .filter(Boolean)
      );

      return options.filter(
        (option) =>
          option.value === players[seat] || !selectedIds.has(option.value)
      );
    },
    [options, players]
  );

  const firstOptions = React.useMemo(
    () => getPositionOptions("east"),
    [getPositionOptions]
  );
  const secondOptions = React.useMemo(
    () => getPositionOptions("south"),
    [getPositionOptions]
  );
  const thirdOptions = React.useMemo(
    () => getPositionOptions("west"),
    [getPositionOptions]
  );
  const fourthOptions = React.useMemo(
    () => getPositionOptions("north"),
    [getPositionOptions]
  );

  const selectedPlayerIds = Object.values(players).filter(Boolean);
  const hasDuplicatePlayers =
    new Set(selectedPlayerIds).size !== selectedPlayerIds.length;
  const canSubmit =
    selectedPlayerIds.length >= 3 &&
    selectedPlayerIds.length <= 4 &&
    !hasDuplicatePlayers;

  const handleSubmit = React.useCallback(async () => {
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
    setError(null);

    try {
      dispatch(
        setRecordingFlow({
          leagueId,
          seasonId,
          selectedPlayerIds,
          selectedPlayersBySeat: players,
          sessionId: null,
        })
      );

      router.push(`/league/${leagueId}/season/${seasonId}/matches/new`);
    } catch {
      setIsSubmitting(false);
      setError("画面遷移に失敗しました。時間をおいて再度お試しください。");
    }
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
    onFirstPlayerChange: handlePlayerChange("east"),
    onSecondPlayerChange: handlePlayerChange("south"),
    onThirdPlayerChange: handlePlayerChange("west"),
    onFourthPlayerChange: handlePlayerChange("north"),
    firstOptions,
    secondOptions,
    thirdOptions,
    fourthOptions,
    handleSubmit,
    handleBack,
  };
};
