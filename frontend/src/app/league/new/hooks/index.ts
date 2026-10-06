"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { createLeague } from "@/features/league/api";
import {
  buildLeagueRulePayload,
  createDefaultLeagueRuleDraft,
  type LeagueGameType,
  type UmaMode,
} from "@/features/league/model/rule-draft";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";
import { searchUsers } from "@/lib/api/users";
import { LEAGUE_NAME_SUFFIX_MODEL } from "@/lib/name-suffix";
import { useAuth } from "@/providers/auth-provider";

import type {
  FloatingCount,
  UmaRank,
} from "@/features/league/model/validation";

type MemberCandidate = {
  userId: string;
  name: string;
  username: string;
};

export const useLeagueNew = () => {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [leagueName, setLeagueName] = React.useState("");
  const [memberQuery, setMemberQuery] = React.useState("");
  const [addedMembers, setAddedMembers] = React.useState<
    Record<string, MemberCandidate>
  >({});
  const [memberCandidates, setMemberCandidates] = React.useState<
    MemberCandidate[]
  >([]);
  const [isSearchingMembers, setIsSearchingMembers] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [showUmaErrors, setShowUmaErrors] = React.useState(false);
  const [errorSummaryFocusToken, setErrorSummaryFocusToken] = React.useState(0);

  React.useEffect(() => {
    if (!user?.uid) {
      return;
    }

    setAddedMembers((prev) => {
      if (!(user.uid in prev)) {
        return prev;
      }

      const next = { ...prev };
      delete next[user.uid];
      return next;
    });
  }, [user?.uid]);

  const [ruleSettings, setRuleSettings] = React.useState(
    createDefaultLeagueRuleDraft
  );

  const failSubmit = React.useCallback((message: string) => {
    setSubmitError(message);
    setErrorSummaryFocusToken((token) => token + 1);
  }, []);

  // リーグ名入力
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
            .filter(
              (candidate) =>
                candidate.userId !== user?.uid &&
                !(candidate.userId in addedMembers)
            )
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
  }, [memberQuery, addedMembers, user?.uid]);

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

    setMemberCandidates([]);
    setError(null);
  }, []);

  const handleRemoveMember = React.useCallback((memberId: string) => {
    setAddedMembers((prev) => {
      const rest = { ...prev };
      delete rest[memberId];
      return rest;
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

    if (!leagueName.trim()) {
      failSubmit("リーグ名を入力してください");
      return;
    }

    const result = buildLeagueRulePayload(ruleSettings);
    if (!result.ok) {
      failSubmit(result.error);
      return;
    }

    setIsSubmitting(true);

    try {
      const createdLeague = await createLeague({
        name: LEAGUE_NAME_SUFFIX_MODEL.toCanonicalName(leagueName),
        memberUserIds: Object.keys(addedMembers).filter(
          (userId) => userId !== user?.uid
        ),
        rule: result.rule,
      });

      router.push(`/league/${createdLeague.id}`);
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        router.replace("/login");
        return;
      }

      failSubmit(getApiErrorMessage(submitError, "リーグ作成に失敗しました"));
    } finally {
      setIsSubmitting(false);
    }
  }, [leagueName, addedMembers, ruleSettings, router, failSubmit, user?.uid]);

  return {
    leagueName,
    creatorName: user?.displayName ?? user?.email ?? "あなた",
    memberCount: Object.keys(addedMembers).length + (user ? 1 : 0),
    memberQuery,
    addedMembers,
    memberCandidates,
    isSearchingMembers,
    isSubmitting,
    isAuthLoading,
    error,
    submitError,
    showUmaErrors,
    errorSummaryFocusToken,
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
  };
};
