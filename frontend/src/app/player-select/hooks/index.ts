import { useState } from "react";

import { Props as DropdownProps } from "@/components/ui/dropdown";

import { leagueMembersData } from "@/mocks/league-member";

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

  //TODO: ここは修正する必要があります
  const onPlayerChange: DropdownProps["onChange"] = (_, value) => {
    setPlayers((prev) => {
      if (prev.east === "") {
        return { ...prev, east: value };
      }
      if (prev.south === "") {
        return { ...prev, south: value };
      }
      if (prev.west === "") {
        return { ...prev, west: value };
      }
      if (prev.north === "") {
        return { ...prev, north: value };
      }
      return prev;
    });
  };

  const handleSubmit = () => {
    console.log("選択されたプレイヤー:", players);
  };

  const handleBack = () => {
    console.log("戻るボタンが押されました");
  };

  return {
    players,
    onPlayerChange,
    handleSubmit,
    handleBack,
    options,
  };
};
