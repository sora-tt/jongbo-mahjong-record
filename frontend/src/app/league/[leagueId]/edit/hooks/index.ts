import { useCallback, useEffect, useState } from "react";

import { useParams } from "next/navigation";

import type { Option } from "@/components/ui/dropdown/types";

import type { League, LeagueIdType, LeagueMember } from "@/types/domain/league";
import type { Rule, RuleIdType } from "@/types/domain/rule";
import type { User, UserBase, UserIdType } from "@/types/domain/user";

import { rulesData } from "@/mocks/rule";
import { userBaseListData } from "@/mocks/user-base";

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
        // dummyLeague の構造を `@/types/domain/league` の League に合わせる
        const dummyLeague: League = {
          leagueId: leagueId,
          name: "ダミーリーグ",
          createdAt: new Date().toISOString() as any,
          rule: allRules["rule001"] as Rule,
          members: {
            "0001": {
              player: userBaseListData["0001"] as User,
              joinedAt: new Date().toISOString() as any,
              role: "member",
              totalPoints: 0,
              gamesPlayed: 0,
              rank: 0,
              numberOfEachOrder: { first: 0, second: 0, third: 0, fourth: 0 },
            },
            "0002": {
              player: userBaseListData["0002"] as User,
              joinedAt: new Date().toISOString() as any,
              role: "member",
              totalPoints: 0,
              gamesPlayed: 0,
              rank: 0,
              numberOfEachOrder: { first: 0, second: 0, third: 0, fourth: 0 },
            },
          },
          seasons: {} as any,
          lastRecordedAt: new Date().toISOString() as any,
          totalGames: 0,
        };

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
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLeagueName(e.target.value);
    },
    []
  );

  const handleMemberQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
    (_e: React.ChangeEvent<HTMLSelectElement>, value: string) => {
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
