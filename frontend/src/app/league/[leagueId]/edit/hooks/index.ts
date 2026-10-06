import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import { fetchLeagueDetail, updateLeague } from "@/features/league/api";
import { toLeagueDetail } from "@/features/league/model/adapter";
import {
  buildLeagueRulePayload,
  createDefaultLeagueRuleDraft,
  toLeagueRuleDraft,
  type LeagueGameType,
  type UmaMode,
} from "@/features/league/model/rule-draft";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";
import { searchUsers } from "@/lib/api/users";
import { LEAGUE_NAME_SUFFIX_MODEL } from "@/lib/name-suffix";

import type {
  FloatingCount,
  UmaRank,
} from "@/features/league/model/validation";

type MemberCandidate = {
  userId: string;
  name: string;
  username: string;
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
    Record<string, MemberCandidate>
  >({});
  const addedMembersRef = React.useRef(addedMembers);
  addedMembersRef.current = addedMembers;
  const [memberCandidates, setMemberCandidates] = React.useState<
    MemberCandidate[]
  >([]);
  const [isSearchingMembers, setIsSearchingMembers] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [showUmaErrors, setShowUmaErrors] = React.useState(false);
  const [errorSummaryFocusToken, setErrorSummaryFocusToken] = React.useState(0);
  const [retryCount, setRetryCount] = React.useState(0);
  const [isRuleLocked, setIsRuleLocked] = React.useState(false);
  const [ruleSettings, setRuleSettings] = React.useState(
    createDefaultLeagueRuleDraft
  );

  const failSubmit = React.useCallback((message: string) => {
    setSubmitError(message);
    setErrorSummaryFocusToken((token) => token + 1);
  }, []);

  React.useEffect(() => {
    let isActive = true;

    if (!leagueId) {
      setError("leagueId が指定されていません");
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setIsLoaded(false);
      setError(null);

      try {
        const league = toLeagueDetail(await fetchLeagueDetail(leagueId));

        if (!isActive) {
          return;
        }

        setLeagueName(LEAGUE_NAME_SUFFIX_MODEL.toInputValue(league.name));
        setIsRuleLocked(league.totalMatchCount > 0);
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
            {} as Record<string, MemberCandidate>
          )
        );
        setRuleSettings(toLeagueRuleDraft(league.rule));
        setIsLoaded(true);
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
  }, [leagueId, retryCount, router]);

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
            .filter((user) => !(user.userId in addedMembersRef.current))
        );
      } catch (searchError) {
        if (!isActive) {
          return;
        }

        setMemberCandidates([]);
        setError(getApiErrorMessage(searchError, "メンバー検索に失敗しました"));
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
  }, [memberQuery]);

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

    setMemberCandidates((prev) =>
      prev.filter((candidate) => candidate.userId !== member.userId)
    );
    setError(null);
  }, []);

  const handleRemoveMember = React.useCallback((id: string) => {
    setAddedMembers((prev) => {
      const newMembers = { ...prev };
      delete newMembers[id];
      return newMembers;
    });
  }, []);

  const handleGameTypeChange = React.useCallback((gameType: LeagueGameType) => {
    setRuleSettings((prev) => ({ ...prev, gameType }));
  }, []);

  const handleOkaSettingChange = React.useCallback(
    (field: "okaStartPoints" | "okaReturnPoints", value: string) => {
      setRuleSettings((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleChomboPenaltyPointsChange = React.useCallback((value: string) => {
    setRuleSettings((prev) => ({ ...prev, chomboPenaltyPoints: value }));
  }, []);

  const handleAllowOffTableKyotakuChange = React.useCallback(
    (value: boolean) => {
      setRuleSettings((prev) => ({ ...prev, allowOffTableKyotaku: value }));
    },
    []
  );

  const handleRotateSeatOrderChange = React.useCallback((value: boolean) => {
    setRuleSettings((prev) => ({ ...prev, rotateSeatOrder: value }));
  }, []);

  const handleModeChange = React.useCallback((mode: UmaMode) => {
    setRuleSettings((prev) => ({ ...prev, mode }));
  }, []);

  const handleFixedUmaChange = React.useCallback(
    (rank: UmaRank, value: string) => {
      setRuleSettings((prev) => ({
        ...prev,
        fixedUma: { ...prev.fixedUma, [rank]: value },
      }));
    },
    []
  );

  const handleFloatingCountUmaChange = React.useCallback(
    (floatingCount: FloatingCount, rank: UmaRank, value: string) => {
      setRuleSettings((prev) => ({
        ...prev,
        floatingCountUma: {
          ...prev.floatingCountUma,
          [floatingCount]: {
            ...prev.floatingCountUma[floatingCount],
            [rank]: value,
          },
        },
      }));
    },
    []
  );

  const handleSubmit = React.useCallback(async () => {
    setError(null);
    setSubmitError(null);
    setShowUmaErrors(true);

    if (!leagueId) {
      failSubmit("leagueId が指定されていません");
      return;
    }

    if (!leagueName.trim()) {
      failSubmit("リーグ名を入力してください");
      return;
    }

    const ruleResult = isRuleLocked
      ? null
      : buildLeagueRulePayload(ruleSettings);
    if (ruleResult && !ruleResult.ok) {
      failSubmit(ruleResult.error);
      return;
    }

    setIsSubmitting(true);

    try {
      const updateInput = {
        name: LEAGUE_NAME_SUFFIX_MODEL.toCanonicalName(leagueName),
        memberUserIds: Object.keys(addedMembers),
        ...(ruleResult?.ok ? { rule: ruleResult.rule } : {}),
      };

      const updatedLeague = await updateLeague(leagueId, updateInput);

      router.push(`/league/${updatedLeague.id}`);
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        router.replace("/login");
        return;
      }

      failSubmit(
        getApiErrorMessage(submitError, "リーグ情報の更新に失敗しました")
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    leagueId,
    leagueName,
    addedMembers,
    ruleSettings,
    isRuleLocked,
    router,
    failSubmit,
  ]);

  const retry = React.useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  return {
    leagueName,
    memberQuery,
    addedMembers,
    memberCandidates,
    isSearchingMembers,
    loading,
    isLoaded,
    isSubmitting,
    error,
    submitError,
    showUmaErrors,
    errorSummaryFocusToken,
    isRuleLocked,
    ruleSettings,
    handleLeagueNameChange,
    handleMemberQueryChange,
    handleAddMember,
    handleRemoveMember,
    handleGameTypeChange,
    handleOkaSettingChange,
    handleChomboPenaltyPointsChange,
    handleAllowOffTableKyotakuChange,
    handleRotateSeatOrderChange,
    handleModeChange,
    handleFixedUmaChange,
    handleFloatingCountUmaChange,
    handleSubmit,
    retry,
  };
};
