import { useState } from "react";

import { leagueMembersData } from "@/mocks/league-member";

import { Props as DropdownProps } from "@/components/ui/dropdown";

export const usePlayerSelect = () => {
  const [players, setPlayers] = useState({
    east: "",
    south: "",
    west: "",
    north: "",
  });
  const leagueMembers = leagueMembersData;
  const options = Object.values(leagueMembers).map((member) => ({
    label: member.player.name,
    value: member.player.name,
  }));

  const onEastPlayerChange: DropdownProps["onChange"] = (_, value) => {
    setPlayers((prev) => {
      return {
        ...prev,
        east: value,
      };
    });
  };

  const onSouthPlayerChange: DropdownProps["onChange"] = (_, value) => {
    setPlayers((prev) => {
      return {
        ...prev,
        south: value,
      };
    });
  };

  const onWestPlayerChange: DropdownProps["onChange"] = (_, value) => {
    setPlayers((prev) => {
      return {
        ...prev,
        west: value,
      };
    });
  };

  const onNorthPlayerChange: DropdownProps["onChange"] = (_, value) => {
    setPlayers((prev) => {
      return {
        ...prev,
        north: value,
      };
    });
  };

  const handleSubmit = () => {
    // 最新のプレイヤー情報を使用
    console.log("選択されたプレイヤー:", players);

    // ここで players を使用して処理を実行
    if (players.east && players.south && players.west && players.north) {
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
    onEastPlayerChange,
    onSouthPlayerChange,
    onWestPlayerChange,
    onNorthPlayerChange,
  };
};
