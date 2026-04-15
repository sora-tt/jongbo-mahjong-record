import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent } from "react";

import { useParams } from "next/navigation";

import { leaguesData } from "@/mocks/league";
import { rulesData } from "@/mocks/rule";
import { userBaseListData } from "@/mocks/user-base";

import type { LeagueIdType } from "@/types/domain/league";
import type { OkaType, Rank, Rule, RuleIdType } from "@/types/domain/rule";
import type { UserBase, UserIdType } from "@/types/domain/user";

type RuleSettings = {
  okaStartPoints: string;
  okaReturnPoints: string;
  uma1: string;
  uma2: string;
  uma3: string;
  uma4: string;
};

export const useLeagueEdit = () => {
  const params = useParams();
  const leagueId = params.leagueId as LeagueIdType;

  const [leagueName, setLeagueName] = useState<string>("");
  const [memberQuery, setMemberQuery] = useState<string>("");
  const [addedMembers, setAddedMembers] = useState<
    Record<UserIdType, UserBase>
  >({});
  const [addedRules, setAddedRules] = useState<Record<RuleIdType, Rule>>({});
  const [ruleSettings, setRuleSettings] = useState<RuleSettings>({
    okaStartPoints: "",
    okaReturnPoints: "",
    uma1: "",
    uma2: "",
    uma3: "",
    uma4: "",
  });

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

        // ルール情報を RuleSettings に変換して初期化
        setRuleSettings({
          okaStartPoints: dummyLeague.rule.oka.startPoints.toString(),
          okaReturnPoints: dummyLeague.rule.oka.returnPoints.toString(),
          uma1: dummyLeague.rule.uma[1]?.toString() || "",
          uma2: dummyLeague.rule.uma[2]?.toString() || "",
          uma3: dummyLeague.rule.uma[3]?.toString() || "",
          uma4: dummyLeague.rule.uma[4]?.toString() || "",
        });
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
  }, [memberQuery]);

  const handleRemoveMember = useCallback((id: UserIdType) => {
    setAddedMembers((prev) => {
      const newMembers = { ...prev };
      delete newMembers[id];
      return newMembers;
    });
  }, []);

  const handleRemoveRule = useCallback((ruleId: RuleIdType) => {
    setAddedRules((prev) => {
      const newRules = { ...prev };
      delete newRules[ruleId];
      return newRules;
    });
  }, []);

  const handleRuleSettingChange = useCallback(
    (field: keyof RuleSettings, value: string) => {
      setRuleSettings((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(() => {
    // ルール設定が編集されている場合は、それを反映
    const okaStartPoints = ruleSettings.okaStartPoints.trim()
      ? parseInt(ruleSettings.okaStartPoints, 10)
      : null;
    const okaReturnPoints = ruleSettings.okaReturnPoints.trim()
      ? parseInt(ruleSettings.okaReturnPoints, 10)
      : null;

    if (!okaStartPoints || !okaReturnPoints) {
      alert("オカの設定をすべて入力してください");
      return;
    }

    const oka: OkaType = {
      startPoints: okaStartPoints,
      returnPoints: okaReturnPoints,
    };

    const uma: Record<Rank, number> = {
      1: ruleSettings.uma1.trim() ? parseInt(ruleSettings.uma1, 10) : 0,
      2: ruleSettings.uma2.trim() ? parseInt(ruleSettings.uma2, 10) : 0,
      3: ruleSettings.uma3.trim() ? parseInt(ruleSettings.uma3, 10) : 0,
      4: ruleSettings.uma4.trim() ? parseInt(ruleSettings.uma4, 10) : 0,
    };

    console.log("Updated League:", {
      leagueName,
      members: Object.values(addedMembers),
      rule: {
        oka,
        uma,
      },
    });
    alert("リーグ情報を更新しました");
  }, [leagueName, addedMembers, ruleSettings]);

  return {
    leagueName,
    memberQuery,
    addedMembers,
    addedRules,
    ruleSettings,
    handleLeagueNameChange,
    handleMemberQueryChange,
    handleAddMember,
    handleRemoveMember,
    handleRemoveRule,
    handleRuleSettingChange,
    handleSubmit,
  };
};
