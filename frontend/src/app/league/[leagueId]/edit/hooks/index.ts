import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import { ApiError } from "@/lib/api/core";
import { fetchLeagueDetail, updateLeague } from "@/lib/api/leagues";
import { searchUsers } from "@/lib/api/users";

import type { UserIdType } from "@/types/domain/user";

type MemberCandidate = {
  userId: UserIdType;
  name: string;
  username: string;
};

type RuleSettings = {
  gameType: "sanma" | "yonma";
  okaStartPoints: string;
  okaReturnPoints: string;
  uma1: string;
  uma2: string;
  uma3: string;
  uma4: string;
};

const DEFAULT_ERROR_MESSAGE =
  "リーグ情報の取得に失敗しました。時間をおいて再度お試しください。";

export const useLeagueEdit = () => {
  const router = useRouter();
  const params = useParams<{ leagueId: string }>();
  const leagueId = params.leagueId;

  const [leagueName, setLeagueName] = React.useState("");
  const [memberQuery, setMemberQuery] = React.useState("");
  const [addedMembers, setAddedMembers] = React.useState<
    Record<UserIdType, MemberCandidate>
  >({});
  const [memberCandidates, setMemberCandidates] = React.useState<
    MemberCandidate[]
  >([]);
  const [isSearchingMembers, setIsSearchingMembers] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ruleSettings, setRuleSettings] = React.useState<RuleSettings>({
    gameType: "yonma",
    okaStartPoints: "",
    okaReturnPoints: "",
    uma1: "",
    uma2: "",
    uma3: "",
    uma4: "",
  });

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
        const league = await fetchLeagueDetail(leagueId);

        if (!isActive) {
          return;
        }

        setLeagueName(league.name);
        setAddedMembers(
          league.members.reduce(
            (acc, member) => ({
              ...acc,
              [member.userId]: {
                userId: member.userId,
                name: member.userName,
                username: member.userId,
              },
            }),
            {} as Record<UserIdType, MemberCandidate>
          )
        );
        setRuleSettings({
          gameType: league.rule.gameType,
          okaStartPoints: league.rule.oka.startingPoints.toString(),
          okaReturnPoints: league.rule.oka.returnPoints.toString(),
          uma1: league.rule.uma.first.toString(),
          uma2: league.rule.uma.second.toString(),
          uma3: league.rule.uma.third.toString(),
          uma4: league.rule.uma.fourth?.toString() ?? "",
        });
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
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [leagueId, router]);

  const handleLeagueNameChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLeagueName(e.target.value);
    },
    []
  );

  const handleMemberQueryChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMemberQuery(e.target.value);
    },
    []
  );

  React.useEffect(() => {
    const trimmedQuery = memberQuery.trim();
    if (!trimmedQuery) {
      setMemberCandidates([]);
      setIsSearchingMembers(false);
      return;
    }

    let isActive = true;
    setIsSearchingMembers(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const users = await searchUsers(trimmedQuery);
        if (!isActive) {
          return;
        }

        setMemberCandidates(
          users
            .map((user) => ({
              userId: user.id,
              name: user.name,
              username: user.username,
            }))
            .filter((user) => !(user.userId in addedMembers))
        );
      } catch (searchError) {
        if (!isActive) {
          return;
        }

        setMemberCandidates([]);
        setError(
          searchError instanceof Error
            ? searchError.message
            : "メンバー検索に失敗しました"
        );
      } finally {
        if (isActive) {
          setIsSearchingMembers(false);
        }
      }
    }, 300);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [memberQuery, addedMembers]);

  const handleAddMember = React.useCallback((member: MemberCandidate) => {
    setAddedMembers((prev) => {
      if (prev[member.userId]) {
        return prev;
      }

      return {
        ...prev,
        [member.userId]: member,
      };
    });

    setMemberQuery("");
    setMemberCandidates([]);
    setError(null);
  }, []);

  const handleRemoveMember = React.useCallback((id: UserIdType) => {
    setAddedMembers((prev) => {
      const newMembers = { ...prev };
      delete newMembers[id];
      return newMembers;
    });
  }, []);

  const handleRuleSettingChange = React.useCallback(
    (field: keyof RuleSettings, value: string) => {
      setRuleSettings((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const umaTotalError = React.useMemo(() => {
    const umaValues =
      ruleSettings.gameType === "sanma"
        ? [ruleSettings.uma1, ruleSettings.uma2, ruleSettings.uma3]
        : [
            ruleSettings.uma1,
            ruleSettings.uma2,
            ruleSettings.uma3,
            ruleSettings.uma4,
          ];

    if (umaValues.some((value) => !value.trim())) {
      return null;
    }

    const total = umaValues.reduce(
      (sum, value) => sum + parseInt(value, 10),
      0
    );

    if (Number.isNaN(total) || total === 0) {
      return null;
    }

    return `ウマの合計が0になるように入力してください（現在: ${total}）`;
  }, [ruleSettings]);

  const handleSubmit = React.useCallback(async () => {
    setError(null);

    const okaStartPoints = ruleSettings.okaStartPoints.trim()
      ? parseInt(ruleSettings.okaStartPoints, 10)
      : null;
    const okaReturnPoints = ruleSettings.okaReturnPoints.trim()
      ? parseInt(ruleSettings.okaReturnPoints, 10)
      : null;
    const uma = {
      1: ruleSettings.uma1.trim() ? parseInt(ruleSettings.uma1, 10) : null,
      2: ruleSettings.uma2.trim() ? parseInt(ruleSettings.uma2, 10) : null,
      3: ruleSettings.uma3.trim() ? parseInt(ruleSettings.uma3, 10) : null,
      4: ruleSettings.uma4.trim() ? parseInt(ruleSettings.uma4, 10) : null,
    };

    if (!leagueId) {
      setError("leagueId が指定されていません");
      return;
    }

    if (!leagueName.trim()) {
      setError("リーグ名を入力してください");
      return;
    }

    if (
      okaStartPoints === null ||
      okaReturnPoints === null ||
      uma[1] === null ||
      uma[2] === null ||
      uma[3] === null ||
      (ruleSettings.gameType === "yonma" && uma[4] === null)
    ) {
      setError("モードに応じたオカとウマをすべて入力してください");
      return;
    }

    if (umaTotalError) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedLeague = await updateLeague(leagueId, {
        name: leagueName.trim(),
        memberUserIds: Object.keys(addedMembers),
        rule: {
          gameType: ruleSettings.gameType,
          oka: {
            startingPoints: okaStartPoints,
            returnPoints: okaReturnPoints,
          },
          uma: {
            first: uma[1],
            second: uma[2],
            third: uma[3],
            fourth: ruleSettings.gameType === "sanma" ? null : uma[4],
          },
        },
      });

      router.push(`/league/${updatedLeague.id}`);
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        router.replace("/login");
        return;
      }

      setError(
        submitError instanceof Error
          ? submitError.message
          : "リーグ情報の更新に失敗しました"
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [leagueId, leagueName, addedMembers, ruleSettings, umaTotalError, router]);

  return {
    leagueName,
    memberQuery,
    addedMembers,
    memberCandidates,
    isSearchingMembers,
    loading,
    isSubmitting,
    error,
    umaTotalError,
    ruleSettings,
    handleLeagueNameChange,
    handleMemberQueryChange,
    handleAddMember,
    handleRemoveMember,
    handleRuleSettingChange,
    handleSubmit,
  };
};
