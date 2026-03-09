import { useState, useEffect } from "react";

import { useParams } from "next/navigation";

import type { UserBase, UserIdType } from "@/types/domain/user"; // UserBase をインポート

import { userBaseListData } from "@/mocks/user-base";

// 仮のデータ構造。実際にはAPIから取得する
interface League {
  id: string;
  name: string;
  members: { id: string; name: string }[];
  rules: {
    id: string;
    name: string;
    mode: string;
    description: string;
    oka: { startPoints: number; returnPoints: number };
    uma: { [key: string]: number };
    scoreCalc: string;
  }[];
}

// User インターフェースを削除し、UserBase を直接使用

interface Rule {
  id: string;
  name: string;
  mode: string;
  description: string;
  oka: { startPoints: number; returnPoints: number };
  uma: { [key: string]: number };
  scoreCalc: string;
}

export const useLeagueEdit = () => {
  const params = useParams();
  const leagueId = params.leagueId as string;

  const [leagueName, setLeagueName] = useState<string>("");
  const [memberQuery, setMemberQuery] = useState<string>("");
  const [addedMembers, setAddedMembers] = useState<
    Record<UserIdType, UserBase>
  >({}); // User を UserBase に変更
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [addedRules, setAddedRules] = useState<{ [key: string]: Rule }>({});
  const [ruleOptions, setRuleOptions] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    if (leagueId) {
      // 実際にはAPIからリーグ情報を取得する
      const fetchLeague = async () => {
        // 仮のデータ
        const dummyLeague: League = {
          id: leagueId,
          name: "ダミーリーグ名",
          members: [
            { id: "0001", name: "岩田" },
            { id: "0002", name: "富田" },
          ],
          rules: [
            {
              id: "rule001",
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
              [member.id]: {
                userId: member.id,
                name: member.name,
              },
            }),
            {}
          ) as Record<UserIdType, UserBase> // 型アサーションを追加
        );
        setAddedRules(
          dummyLeague.rules.reduce(
            (acc, rule) => ({ ...acc, [rule.id]: rule }),
            {}
          )
        );

        // 仮のルールオプション
        setRuleOptions([
          { value: "rule001", label: "Mリーグルール" },
          { value: "rule002", label: "天鳳三人打ち" },
        ]);
      };
      fetchLeague();
    }
  }, [leagueId]);

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

  const handleRuleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRule(e.target.value);
  };

  const handleAddRule = () => {
    if (selectedRule) {
      // 実際には選択されたルールの詳細を取得する
      const ruleDetail: Rule = {
        id: selectedRule,
        name: `${selectedRule}のルール`,
        mode: "yonma",
        description: "選択されたルールの説明",
        oka: { startPoints: 25000, returnPoints: 30000 },
        uma: { "1": 20, "2": 10, "3": -10, "4": -20 },
        scoreCalc: "decimal",
      };
      setAddedRules((prev) => ({ ...prev, [ruleDetail.id]: ruleDetail }));
      setSelectedRule(null);
    }
  };

  const handleRemoveRule = (id: string) => {
    setAddedRules((prev) => {
      const newRules = { ...prev };
      delete newRules[id];
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
    alert("リーグ情報を更新しました！（ダミー）");
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
