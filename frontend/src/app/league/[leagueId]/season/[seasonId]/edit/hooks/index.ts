import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import { fetchLeagueMembers } from "@/features/league/api";
import { fetchSeasonDetail, updateSeason } from "@/features/season/api";
import { toSeasonDetail } from "@/features/season/model/adapter";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";
import { SEASON_NAME_SUFFIX_MODEL } from "@/lib/name-suffix";

type SeasonStatus = "active" | "archived";
type SeasonMember = ReturnType<typeof toSeasonDetail>["members"][number];
type SelectableMember = {
  userId: string;
  userName: string;
};

const DEFAULT_ERROR_MESSAGE =
  "シーズン情報の取得に失敗しました。時間をおいて再度お試しください。";
const DEFAULT_MEMBERS_ERROR_MESSAGE =
  "リーグ参加者の取得に失敗しました。時間をおいて再度お試しください。";

export const useSeasonEdit = () => {
  const router = useRouter();
  const params = useParams<{ leagueId: string; seasonId: string }>();
  const { leagueId, seasonId } = params;
  const routeKey = JSON.stringify([leagueId, seasonId]);
  const [seasonName, setSeasonName] = React.useState("");
  const [status, setStatus] = React.useState<SeasonStatus>("active");
  const [members, setMembers] = React.useState<SeasonMember[]>([]);
  const [seasonRequestRouteKey, setSeasonRequestRouteKey] = React.useState<
    string | null
  >(null);
  const [leagueMembers, setLeagueMembers] = React.useState<SelectableMember[]>(
    []
  );
  const [leagueMembersLeagueId, setLeagueMembersLeagueId] = React.useState<
    string | null
  >(null);
  const [selectedMembers, setSelectedMembers] = React.useState<
    Record<string, SelectableMember>
  >({});
  const [selectedMembersRouteKey, setSelectedMembersRouteKey] = React.useState<
    string | null
  >(null);
  const [areLeagueMembersLoading, setAreLeagueMembersLoading] =
    React.useState(true);
  const [leagueMembersError, setLeagueMembersError] = React.useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [notFound, setNotFound] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const [leagueMembersRetryCount, setLeagueMembersRetryCount] =
    React.useState(0);
  const submitInProgressRef = React.useRef(false);

  const currentSelectedMembers = React.useMemo<
    Record<string, SelectableMember>
  >(
    () => (selectedMembersRouteKey === routeKey ? selectedMembers : {}),
    [routeKey, selectedMembers, selectedMembersRouteKey]
  );
  const existingMemberIds = React.useMemo(
    () => new Set<string>(members.map((member) => member.userId)),
    [members]
  );
  const candidateMembers = React.useMemo(
    () =>
      leagueMembersLeagueId === leagueId && !leagueMembersError
        ? leagueMembers.filter(
            (member) => !existingMemberIds.has(member.userId)
          )
        : [],
    [
      existingMemberIds,
      leagueId,
      leagueMembers,
      leagueMembersError,
      leagueMembersLeagueId,
    ]
  );

  React.useEffect(() => {
    let isActive = true;

    if (!leagueId || !seasonId) {
      setSeasonRequestRouteKey(routeKey);
      setIsLoaded(false);
      setNotFound(false);
      setError("leagueId または seasonId が指定されていません");
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setSeasonRequestRouteKey(routeKey);
      setIsLoaded(false);
      setNotFound(false);
      setError(null);

      try {
        const season = toSeasonDetail(
          await fetchSeasonDetail(leagueId, seasonId)
        );

        if (!isActive) {
          return;
        }

        setSeasonName(SEASON_NAME_SUFFIX_MODEL.toInputValue(season.name));
        setStatus(season.status);
        setMembers(season.members);
        setIsLoaded(true);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace("/login");
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 404) {
          setNotFound(true);
          return;
        }

        setError(getApiErrorMessage(loadError, DEFAULT_ERROR_MESSAGE));
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
  }, [leagueId, retryCount, routeKey, router, seasonId]);

  React.useEffect(() => {
    let isActive = true;

    if (!leagueId) {
      setLeagueMembersLeagueId(leagueId);
      setLeagueMembers([]);
      setLeagueMembersError("leagueId が指定されていません");
      setAreLeagueMembersLoading(false);
      return;
    }

    const loadLeagueMembers = async () => {
      setLeagueMembersLeagueId(leagueId);
      setLeagueMembers([]);
      setAreLeagueMembersLoading(true);
      setLeagueMembersError(null);

      try {
        const members = await fetchLeagueMembers(leagueId);
        if (!isActive) {
          return;
        }

        setLeagueMembers(
          members.map((member) => ({
            userId: member.userId,
            userName: member.userName,
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

        setLeagueMembersError(
          getApiErrorMessage(loadError, DEFAULT_MEMBERS_ERROR_MESSAGE)
        );
      } finally {
        if (isActive) {
          setAreLeagueMembersLoading(false);
        }
      }
    };

    void loadLeagueMembers();

    return () => {
      isActive = false;
    };
  }, [leagueId, leagueMembersRetryCount, router]);

  React.useEffect(() => {
    setSelectedMembers({});
    setSelectedMembersRouteKey(routeKey);
  }, [routeKey]);

  const handleSubmit = React.useCallback(async () => {
    if (submitInProgressRef.current) {
      return;
    }

    if (!leagueId || !seasonId) {
      setError("leagueId または seasonId が指定されていません");
      return;
    }

    if (!seasonName.trim()) {
      setError("シーズン名を入力してください");
      return;
    }

    submitInProgressRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      await updateSeason(leagueId, seasonId, {
        name: SEASON_NAME_SUFFIX_MODEL.toCanonicalName(seasonName),
        status,
        ...(Object.keys(currentSelectedMembers).length > 0
          ? { addMemberUserIds: Object.keys(currentSelectedMembers) }
          : {}),
      });
      router.push(`/league/${leagueId}/season/${seasonId}`);
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        router.replace("/login");
        return;
      }

      setError(getApiErrorMessage(submitError, "シーズン更新に失敗しました"));
    } finally {
      submitInProgressRef.current = false;
      setIsSubmitting(false);
    }
  }, [currentSelectedMembers, leagueId, router, seasonName, seasonId, status]);

  const handleMemberToggle = React.useCallback(
    (memberId: string) => {
      setSelectedMembers((previous) => {
        const current = selectedMembersRouteKey === routeKey ? previous : {};
        if (memberId in current) {
          const next = { ...current };
          delete next[memberId];
          return next;
        }

        const member = candidateMembers.find(
          (item) => item.userId === memberId
        );
        if (!member) {
          return previous;
        }

        return { ...current, [memberId]: member };
      });
      setSelectedMembersRouteKey(routeKey);
    },
    [candidateMembers, routeKey, selectedMembersRouteKey]
  );

  const retry = React.useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  const retryLeagueMembers = React.useCallback(() => {
    setLeagueMembersRetryCount((count) => count + 1);
  }, []);

  return {
    leagueId,
    seasonId,
    seasonName,
    status,
    members,
    candidateMembers,
    selectedMembers: currentSelectedMembers,
    isLoading: isLoading || seasonRequestRouteKey !== routeKey,
    areLeagueMembersLoading:
      areLeagueMembersLoading || leagueMembersLeagueId !== leagueId,
    leagueMembersError:
      leagueMembersLeagueId === leagueId ? leagueMembersError : null,
    isLoaded,
    notFound,
    isSubmitting,
    error,
    setSeasonName,
    setStatus,
    handleMemberToggle,
    handleSubmit,
    retry,
    retryLeagueMembers,
  };
};
