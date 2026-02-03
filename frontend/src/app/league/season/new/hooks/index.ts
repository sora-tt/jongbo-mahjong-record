import { useCallback, useState, type ChangeEvent } from "react";

import type { LeagueMember, LeagueSeasonMember } from "@/types/domain/league";
import type { UserIdType } from "@/types/domain/user";

import { leagueData1 } from "@/mocks/league";

export const useSeasonNew = () => {
  const leagueMembers: Record<UserIdType, LeagueMember> = leagueData1.members;

  // 全員選択スタートにしたいなら（以前と同じ挙動）こう初期化
  const [selectedMembers, setSelectedMembers] = useState<
    Record<UserIdType, LeagueSeasonMember>
  >(() => {
    const initial: Record<UserIdType, LeagueSeasonMember> = {};
    for (const [userId, member] of Object.entries(leagueMembers)) {
      initial[userId as UserIdType] = member as LeagueSeasonMember;
    }
    return initial;
  });

  const [seasonName, setSeasonName] = useState("");

  const handleMemberToggle = useCallback(
    (memberId: UserIdType) => {
      setSelectedMembers((prev) => {
        const exists = memberId in prev;

        // いったん shallow copy
        const next: Record<UserIdType, LeagueSeasonMember> = { ...prev };

        if (exists) {
          // すでに選択されている → 外す
          delete next[memberId];
          return next;
        }

        // まだ選択されていない → leagueMembers から該当プレイヤーを探して追加
        const base = leagueMembers[memberId];
        if (!base) {
          // 想定外: 該当プレイヤーがいなかった場合は何もしない
          return prev;
        }

        // LeagueMember → LeagueSeasonMember への変換が必要ならここで付け足す
        const seasonMember: LeagueSeasonMember = {
          ...(base as LeagueSeasonMember),
          // 例:
          // seasonPoints: 0,
          // seasonRank: 0,
        };

        next[memberId] = seasonMember;
        return next;
      });
    },
    [leagueMembers]
  );

  const handleSeasonNameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSeasonName(e.target.value);
    },
    []
  );

  const handleSubmit = useCallback(() => {
    // TODO: POSTリクエスト
    const membersArray = Object.values(selectedMembers); // 必要なら配列に
    console.log({ seasonName, membersArray });
  }, [seasonName, selectedMembers]);

  return {
    leagueMembers,
    selectedMembers,
    seasonName,
    handleMemberToggle,
    handleSeasonNameChange,
    handleSubmit,
  };
};
