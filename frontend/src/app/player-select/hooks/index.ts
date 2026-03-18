import { useState } from "react";

import { Props as DropdownProps } from "@/components/ui/dropdown";

import { leagueMembersData } from "@/mocks/league-member";

export const usePlayerSelect = () => {
  const [players, setPlayers] = useState({
    first: "",
    second: "",
    third: "",
    fourth: "",
  });
  const leagueMembers = leagueMembersData;
  const options = Object.values(leagueMembers).map((member) => ({
    label: member.player.name,
    value: member.player.name,
  }));

  //TODO: ここは修正する必要があります

  const onFirstPlayerChange: DropdownProps["onChange"] = (_, value) => {
    setPlayers((prev) => {
      return {
        ...prev,
        first: value,
      };
    });
  };

  const onSecondPlayerChange: DropdownProps["onChange"] = (_, value) => {
    setPlayers((prev) => {
      return {
        ...prev,
        second: value,
      };
    });
  };

  const onThirdPlayerChange: DropdownProps["onChange"] = (_, value) => {
    setPlayers((prev) => {
      return {
        ...prev,
        third: value,
      };
    });
  };

  const onFourthPlayerChange: DropdownProps["onChange"] = (_, value) => {
    setPlayers((prev) => {
      return {
        ...prev,
        fourth: value,
      };
    });
  };

  const handleSubmit = () => {
    // 最新のプレイヤー情報を使用
    console.log("選択されたプレイヤー:", players);

    // ここで players を使用して処理を実行
    if (players.first && players.second && players.third && players.fourth) {
      console.log("全員選択されました");
      // API呼び出しやナビゲーションなど
    } else {
      console.log("全員選択されていません");
    }
  };

  const handleBack = () => {
    console.log("戻るボタンが押されました");
  };

  return {
    players,
    handleSubmit,
    handleBack,
    options,
    onFirstPlayerChange,
    onSecondPlayerChange,
    onThirdPlayerChange,
    onFourthPlayerChange,
  };
};
