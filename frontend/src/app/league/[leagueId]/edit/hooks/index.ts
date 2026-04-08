import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent } from "react";

import { useParams } from "next/navigation";

import { leaguesData } from "@/mocks/league";
import { rulesData } from "@/mocks/rule";
import { userBaseListData } from "@/mocks/user-base";

import type { Option } from "@/components/ui/dropdown/types";

import type { LeagueIdType } from "@/types/domain/league";
import type { Rule, RuleIdType } from "@/types/domain/rule";
import type { UserBase, UserIdType } from "@/types/domain/user";

export const useLeagueEdit = () => {
  const params = useParams();
  const leagueId = params.leagueId as LeagueIdType;

  const [leagueName, setLeagueName] = useState<string>("");
  const [memberQuery, setMemberQuery] = useState<string>("");
  const [addedMembers, setAddedMembers] = useState<
    Record<UserIdType, UserBase>
  >({});
  const [selectedRule, setSelectedRule] = useState<RuleIdType | null>(null);
  const [addedRules, setAddedRules] = useState<Record<RuleIdType, Rule>>({});
  const [ruleOptions, setRuleOptions] = useState<Option[]>([]);

  const allRules = rulesData;

  useEffect(() => {
    if (leagueId) {
      const fetchLeague = async () => {
        const dummyLeague =
          leaguesData[leagueId] ?? Object.values(leaguesData)[0];

        setLeagueName(dummyLeague.name);
        setAddedMembers(
          Object.values(dummyLeague.members).reduce(
            (acc, leagueMember) => ({
              ...acc,
              [leagueMember.player.userId]: leagueMember.player,
            }),
            {} as Record<UserIdType, UserBase>
          )
        );
        setAddedRules({
          [dummyLeague.rule.ruleId]: dummyLeague.rule,
        });

        setRuleOptions(
          Object.entries(allRules).map(([id, rule]) => ({
            label: rule.name,
            value: id,
          }))
        );
      };
      fetchLeague();
    }
  }, [leagueId, allRules]);

  const handleLeagueNameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setLeagueName(e.target.value);
    },
    []
  );

  const handleMemberQueryChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setMemberQuery(e.target.value);
    },
    []
  );

  const handleAddMember = useCallback(() => {
    const trimmed = memberQuery.trim();
    if (!trimmed) return;

    const found = userBaseListData[trimmed as UserIdType];
    if (!found) {
      alert("該当するメンバーIDが見つかりません");
      return;
    }

    setAddedMembers((prev) => {
      if (prev[found.userId]) {
        return prev;
      }

      return {
        ...prev,
        [found.userId]: found,
      };
    });

    setMemberQuery("");
  }, [memberQuery, userBaseListData]);

  const handleRemoveMember = useCallback((id: UserIdType) => {
    setAddedMembers((prev) => {
      const newMembers = { ...prev };
      delete newMembers[id];
      return newMembers;
    });
  }, []);

  const handleRuleSelectChange = useCallback(
    (_e: ChangeEvent<HTMLSelectElement>, value: string) => {
      if (value === "") {
        setSelectedRule(null);
        return;
      }
      setSelectedRule(value as RuleIdType);
    },
    []
  );

  const handleAddRule = useCallback(() => {
    if (!selectedRule) return;

    const rule = allRules[selectedRule];
    if (!rule) return;

    setAddedRules((prev) => {
      if (prev[rule.ruleId]) {
        return prev;
      }
      return {
        ...prev,
        [rule.ruleId]: rule,
      };
    });

    setSelectedRule(null);
  }, [selectedRule, allRules]);

  const handleRemoveRule = useCallback((ruleId: RuleIdType) => {
    setAddedRules((prev) => {
      const newRules = { ...prev };
      delete newRules[ruleId];
      return newRules;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    console.log("Updated League:", {
      leagueName,
      members: Object.values(addedMembers),
      rules: Object.values(addedRules),
    });
    alert("リーグ情報を更新しました");
  }, [leagueName, addedMembers, addedRules]);

  return {
    leagueName,
    memberQuery,
    addedMembers,
    selectedRule,
    addedRules,
    ruleOptions,
    handleLeagueNameChange,
    handleMemberQueryChange,
    handleAddMember,
    handleRemoveMember,
    handleRuleSelectChange,
    handleAddRule,
    handleRemoveRule,
    handleSubmit,
  };
};
