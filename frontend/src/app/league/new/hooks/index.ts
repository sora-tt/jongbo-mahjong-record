"use client";

import * as React from "react";

import type { Option } from "@/components/ui/dropdown/types";

import { rulesData } from "@/mocks/rule";
import { userBaseListData } from "@/mocks/user-base";
import { Rule, RuleIdType } from "@/types/domain/rule";
import { UserBase, UserIdType } from "@/types/domain/user";

export const useLeagueNew = () => {
  const users = userBaseListData;
  const rules = rulesData;

  // Dropdown 用 options（value に id、label に表示名）
  const ruleOptions: Option[] = Object.entries(rules).map(([id, rule]) => ({
    label: rule.name,
    value: id,
  }));

  const [leagueName, setLeagueName] = React.useState("");
  const [memberQuery, setMemberQuery] = React.useState("");
  const [addedMembers, setAddedMembers] = React.useState<
    Record<UserIdType, UserBase>
  >({});
  const [selectedRule, setSelectedRule] = React.useState<string>("");
  const [addedRules, setAddedRules] = React.useState<Record<RuleIdType, Rule>>(
    {}
  );

  // リーグ名入力
  const handleLeagueNameChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLeagueName(e.target.value);
    },
    []
  );

  // メンバー ID 入力
  const handleMemberQueryChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMemberQuery(e.target.value);
    },
    []
  );

  // メンバー追加
  const handleAddMember = React.useCallback(() => {
    const trimmed = memberQuery.trim();
    if (!trimmed) return;

    const found = users[trimmed];
    if (!found) {
      // TODO: alert ではなくトーストに差し替え
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
  }, [memberQuery, users]);

  // メンバー削除
  const handleRemoveMember = React.useCallback((memberId: UserIdType) => {
    setAddedMembers((prev) => {
      const rest = { ...prev };
      delete rest[memberId];
      return rest;
    });
  }, []);

  // Dropdown の onChange (e, value) に合わせたハンドラ
  const handleRuleSelectChange = React.useCallback(
    (_e: React.ChangeEvent<HTMLSelectElement>, value: string) => {
      setSelectedRule(value);
    },
    []
  );

  // ルール追加
  const handleAddRule = React.useCallback(() => {
    if (!selectedRule) return;

    const rule = rules[selectedRule];
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
  }, [selectedRule, rules]);

  // ルール削除
  const handleRemoveRule = React.useCallback((ruleId: RuleIdType) => {
    setAddedRules((prev) => {
      const rest = { ...prev };
      delete rest[ruleId];
      return rest;
    });
  }, []);

  // 送信（ひとまず console.log）
  const handleSubmit = React.useCallback(() => {
    console.log("create league", {
      leagueName,
      // Record(オブジェクト) なので keys を配列にする
      memberIds: Object.keys(addedMembers) as UserIdType[],
      ruleIds: Object.keys(addedRules) as RuleIdType[],
    });
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
