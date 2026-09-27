"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { createLeague } from "@/features/league/api";
import {
  getUmaTotalError,
  parseIntegerInput,
} from "@/features/league/model/validation";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";
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

  const umaTotalError = React.useMemo(() => {
    const values =
      ruleSettings.gameType === "sanma"
        ? [ruleSettings.uma1, ruleSettings.uma2, ruleSettings.uma3]
        : [
            ruleSettings.uma1,
            ruleSettings.uma2,
            ruleSettings.uma3,
            ruleSettings.uma4,
          ];

    if (values.some((value) => !value.trim())) {
      return null;
    }

    return getUmaTotalError(values);
  }, [ruleSettings]);

  const handleSubmit = React.useCallback(async () => {
    setError(null);

    const okaStartPoints = parseIntegerInput(ruleSettings.okaStartPoints);
    const okaReturnPoints = parseIntegerInput(ruleSettings.okaReturnPoints);
    const uma = {
      1: parseIntegerInput(ruleSettings.uma1),
      2: parseIntegerInput(ruleSettings.uma2),
      3: parseIntegerInput(ruleSettings.uma3),
      4: parseIntegerInput(ruleSettings.uma4),
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

    if (umaTotalError) {
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

      setError(getApiErrorMessage(submitError, "リーグ作成に失敗しました"));
    } finally {
      setIsSubmitting(false);
    }
  }, [leagueName, addedMembers, ruleSettings, router, umaTotalError]);

  return {
    leagueName,
    memberQuery,
    addedMembers,
    memberCandidates,
    isSearchingMembers,
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
