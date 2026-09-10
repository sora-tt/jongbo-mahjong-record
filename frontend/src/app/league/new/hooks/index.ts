"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api/core";
import { createLeague } from "@/lib/api/leagues";
import { searchUsers } from "@/lib/api/users";
import { UserIdType } from "@/types/domain/user";

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

export const useLeagueNew = () => {
  const router = useRouter();

  const [leagueName, setLeagueName] = React.useState("");
  const [memberQuery, setMemberQuery] = React.useState("");
  const [addedMembers, setAddedMembers] = React.useState<
    Record<UserIdType, MemberCandidate>
  >({});
  const [memberCandidates, setMemberCandidates] = React.useState<
    MemberCandidate[]
  >([]);
  const [isSearchingMembers, setIsSearchingMembers] = React.useState(false);
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

  const handleRemoveMember = React.useCallback((memberId: UserIdType) => {
    setAddedMembers((prev) => {
      const rest = { ...prev };
      delete rest[memberId];
      return rest;
    });
  }, []);

  const handleRuleSettingChange = React.useCallback(
    (field: keyof RuleSettings, value: string) => {
      setRuleSettings((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

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

    setIsSubmitting(true);

    try {
      const createdLeague = await createLeague({
        name: leagueName.trim(),
        memberUserIds: Object.keys(addedMembers) as UserIdType[],
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

      router.push(`/league/${createdLeague.id}`);
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        router.replace("/login");
        return;
      }

      setError(
        submitError instanceof Error
          ? submitError.message
          : "リーグ作成に失敗しました"
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [leagueName, addedMembers, ruleSettings, router]);

  return {
    leagueName,
    memberQuery,
    addedMembers,
    memberCandidates,
    isSearchingMembers,
    isSubmitting,
    error,
    ruleSettings,

    handleLeagueNameChange,
    handleMemberQueryChange,
    handleAddMember,
    handleRemoveMember,
    handleRuleSettingChange,
    handleSubmit,
  };
};
