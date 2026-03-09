import { useState, useEffect } from "react";

import { useParams } from "next/navigation";

import type { Option } from "@/components/ui/dropdown/types"; // Option をインポート

import type { League } from "@/types/domain/league"; // League インターフェースをインポート
import type { Rule } from "@/types/domain/rule"; // Rule インターフェースをインポート
import type { UserBase, UserIdType } from "@/types/domain/user";

import { rulesData } from "@/mocks/rule"; // rulesData をインポート
import { userBaseListData } from "@/mocks/user-base";

export const useLeagueEdit = () => {
  const params = useParams();
  const leagueId = params.leagueId as string;

  const [leagueName, setLeagueName] = useState<string>("");
  const [memberQuery, setMemberQuery] = useState<string>("");
  const [addedMembers, setAddedMembers] = useState<
    Record<UserIdType, UserBase>
  >({});
  const [selectedRule, setSelectedRule] = useState<string>("");
  const [addedRules, setAddedRules] = useState<Record<string, Rule>>({}); // RuleIdType は string なので、Record<string, Rule> に変更
  const [ruleOptions, setRuleOptions] = useState<Option[]>([]); // Option[] に変更

  const allRules = rulesData; // 全ルールデータ

  useEffect(() => {
    if (leagueId) {
      // 実際にはAPIからリーグ情報を取得する
      const fetchLeague = async () => {
        // 仮のデータ
        const dummyLeague: League = {
          id: leagueId,
          name: "ダミーリーグ",
          members: [
            { userId: "0001", name: "岩田" },
            { userId: "0002", name: "富田" },
          ],
          rules: [
            {
              ruleId: "rule001",
              name: "Mリーグルール",
              mode: "yonma",
              description: "Mリーグの一般的なルール",
              oka: { startPoints: 25000, returnPoints: 30000 },
              uma: { "1": 20, "2": 10, "3": -10, "4": -20 },
              scoreCalc: "decimal",
            },
          ],
        };

        setLeagueName(dummyLeague.name);
        setAddedMembers(
          dummyLeague.members.reduce(
            (acc, member) => ({
              ...acc,
              [member.userId]: {
                userId: member.userId,
                name: member.name,
              },
            }),
            {}
          ) as Record<UserIdType, UserBase>
        );
        setAddedRules(
          dummyLeague.rules.reduce(
            (acc, rule) => ({ ...acc, [rule.ruleId]: rule }),
            {}
          ) as Record<string, Rule>
        );

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

  const handleLeagueNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLeagueName(e.target.value);
  };

  const handleMemberQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMemberQuery(e.target.value);
  };

  const handleAddMember = () => {
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
  };

  const handleRemoveMember = (id: string) => {
    setAddedMembers((prev) => {
      const newMembers = { ...prev };
      delete newMembers[id];
      return newMembers;
    });
  };

  const handleRuleSelectChange = (
    _e: React.ChangeEvent<HTMLSelectElement>,
    value: string
  ) => {
    setSelectedRule(value);
  };

  const handleAddRule = () => {
    if (!selectedRule) return;

    const rule = allRules[selectedRule as keyof typeof allRules]; // allRules を参照
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

    setSelectedRule("");
  };

  const handleRemoveRule = (ruleId: string) => {
    setAddedRules((prev) => {
      const newRules = { ...prev };
      delete newRules[ruleId];
      return newRules;
    });
  };

  const handleSubmit = () => {
    console.log("Updated League:", {
      leagueName,
      members: Object.values(addedMembers),
      rules: Object.values(addedRules),
    });
    // 実際にはAPIを呼び出してリーグ情報を更新する
    alert("リーグ情報を更新しました");
  };

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
