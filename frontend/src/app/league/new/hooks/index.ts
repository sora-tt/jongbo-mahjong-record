"use client";

import * as React from "react";

import { userBaseListData } from "@/mocks/user-base";
import { UserBase, UserIdType } from "@/types/domain/user";

type RuleSettings = {
  okaStartPoints: string;
  okaReturnPoints: string;
  uma1: string;
  uma2: string;
  uma3: string;
  uma4: string;
};

export const useLeagueNew = () => {
  const users = userBaseListData;

  const [leagueName, setLeagueName] = React.useState("");
  const [memberQuery, setMemberQuery] = React.useState("");
  const [addedMembers, setAddedMembers] = React.useState<
    Record<UserIdType, UserBase>
  >({});

  // ウマとオカの手動設定用状態
  const [ruleSettings, setRuleSettings] = React.useState<RuleSettings>({
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

  // ルール設定入力ハンドラー
  const handleRuleSettingChange = React.useCallback(
    (field: keyof RuleSettings, value: string) => {
      setRuleSettings((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  // 送信（ひとまず console.log）
  const handleSubmit = React.useCallback(() => {
    // ruleSettings の数値パースとバリデーション
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

    // バリデーション: 必須項目のチェック
    if (!leagueName.trim()) {
      alert("リーグ名を入力してください");
      return;
    }

    if (Object.keys(addedMembers).length === 0) {
      alert("最低1人のメンバーを追加してください");
      return;
    }

    if (
      okaStartPoints === null ||
      okaReturnPoints === null ||
      Object.values(uma).some((v) => v === null)
    ) {
      alert("オカとウマをすべて入力してください");
      return;
    }

    console.log("create league", {
      leagueName,
      // Record(オブジェクト) なので keys を配列にする
      memberIds: Object.keys(addedMembers) as UserIdType[],
      // ルール設定を直接ペイロードに含める
      rule: {
        oka: {
          startPoints: okaStartPoints,
          returnPoints: okaReturnPoints,
        },
        uma: {
          1: uma[1],
          2: uma[2],
          3: uma[3],
          4: uma[4],
        },
      },
    });
  }, [leagueName, addedMembers, ruleSettings]);

  return {
    leagueName,
    memberQuery,
    addedMembers,
    ruleSettings,

    handleLeagueNameChange,
    handleMemberQueryChange,
    handleAddMember,
    handleRemoveMember,
    handleRuleSettingChange,
    handleSubmit,
  };
};
