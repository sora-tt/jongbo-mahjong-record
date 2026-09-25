import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import { fetchLeagueDetail, fetchLeagueMembers } from "@/features/league/api";
import { createSeason } from "@/features/season/api";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";

const DEFAULT_ERROR_MESSAGE =
  "シーズン作成画面の取得に失敗しました。時間をおいて再度お試しください。";

type SelectableMember = {
  userId: string;
  userName: string;
};

export const useSeasonNew = () => {
  const router = useRouter();
  const params = useParams<{ leagueId: string }>();
  const leagueId = params.leagueId;

  const [leagueName, setLeagueName] = React.useState("");
  const [leagueMembers, setLeagueMembers] = React.useState<SelectableMember[]>(
    []
  );
  const [selectedMembers, setSelectedMembers] = React.useState<
    Record<string, SelectableMember>
  >({});
  const [seasonName, setSeasonName] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isActive = true;

    if (!leagueId) {
      setError("leagueId が指定されていません");
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [league, members] = await Promise.all([
          fetchLeagueDetail(leagueId),
          fetchLeagueMembers(leagueId),
        ]);

        if (!isActive) {
          return;
        }

        const selectableMembers = members.map((member) => ({
          userId: member.userId,
          userName: member.userName,
        }));

        setLeagueName(league.name);
        setLeagueMembers(selectableMembers);
        setSelectedMembers(
          selectableMembers.reduce(
            (acc, member) => {
              acc[member.userId] = member;
              return acc;
            },
            {} as Record<string, SelectableMember>
          )
        );
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace("/login");
          return;
        }

        setError(getApiErrorMessage(loadError, DEFAULT_ERROR_MESSAGE));
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [leagueId, router]);

  const handleMemberToggle = React.useCallback(
    (memberId: string) => {
      setSelectedMembers((prev) => {
        const next = { ...prev };

        if (memberId in next) {
          delete next[memberId];
          return next;
        }

        const member = leagueMembers.find((item) => item.userId === memberId);
        if (!member) {
          return prev;
        }

        next[memberId] = member;
        return next;
      });
    },
    [leagueMembers]
  );

  const handleSeasonNameChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSeasonName(e.target.value);
    },
    []
  );

  const handleSubmit = React.useCallback(async () => {
    if (!leagueId) {
      setError("leagueId が指定されていません");
      return;
    }

    if (!seasonName.trim()) {
      setError("シーズン名を入力してください");
      return;
    }

    if (Object.keys(selectedMembers).length === 0) {
      setError("参加者を1人以上選択してください");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const season = await createSeason(leagueId, {
        name: seasonName.trim(),
        memberUserIds: Object.keys(selectedMembers),
      });

      router.push(`/league/${leagueId}/season/${season.id}`);
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        router.replace("/login");
        return;
      }

      setError(getApiErrorMessage(submitError, "シーズン作成に失敗しました"));
    } finally {
      setIsSubmitting(false);
    }
  }, [leagueId, router, seasonName, selectedMembers]);

  return {
    leagueId,
    leagueName,
    leagueMembers,
    selectedMembers,
    seasonName,
    loading,
    isSubmitting,
    error,
    handleMemberToggle,
    handleSeasonNameChange,
    handleSubmit,
  };
};
