"use client";

import * as React from "react";

import { Button } from "@/components/ui/button/index";
import { Dropdown } from "@/components/ui/dropdown/index";
import { TextBox } from "@/components/ui/text-box/index";

import { usePlayerSelect } from "./hooks";

const SELECT_PLAYER_DEFAULT_TEXT = "プレイヤーを選択";

const PlayerSelectPage: React.FC = () => {
  const {
    handleSubmit,
    handleBack,
    onEastPlayerChange,
    onSouthPlayerChange,
    onWestPlayerChange,
    onNorthPlayerChange,
    options,
  } = usePlayerSelect();

  const [scores, setScores] = React.useState({
    first: "",
    second: "",
    third: "",
    fourth: "",
  });

  const handleScoreChange =
    (position: keyof typeof scores) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setScores((prev) => ({
        ...prev,
        [position]: e.target.value,
      }));
    };

  return (
    <div className="flex-1 bg-white min-h-screen font-jp">
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-text-dark mb-24">対局記録</h1>
        <div className="flex flex-col text-text-dark gap-4 mb-36">
          {/* 東 */}
          <div className="flex items-center gap-2">
            <span className="w-8 font-bold">東</span>
            <Dropdown
              defaultOption={SELECT_PLAYER_DEFAULT_TEXT}
              options={options}
              onChange={onEastPlayerChange}
            />
            <TextBox
              variant="number"
              type="number"
              placeholder="点数"
              value={scores.first}
              onChange={handleScoreChange("first")}
            />
            <span className="font-bold">00点</span>
          </div>
          {/* 南 */}
          <div className="flex items-center gap-2">
            <span className="w-8 font-bold">南</span>
            <Dropdown
              defaultOption={SELECT_PLAYER_DEFAULT_TEXT}
              options={options}
              onChange={onSouthPlayerChange}
            />
            <TextBox
              variant="number"
              type="number"
              placeholder="点数"
              value={scores.second}
              onChange={handleScoreChange("second")}
            />
            <span className="font-bold">00点</span>
          </div>
          {/* 西 */}
          <div className="flex items-center gap-2">
            <span className="w-8 font-bold">西</span>
            <Dropdown
              defaultOption={SELECT_PLAYER_DEFAULT_TEXT}
              options={options}
              onChange={onWestPlayerChange}
            />
            <TextBox
              variant="number"
              type="number"
              placeholder="点数"
              value={scores.third}
              onChange={handleScoreChange("third")}
            />
            <span className="font-bold">00点</span>
          </div>
          {/* 北 */}
          <div className="flex items-center gap-2">
            <span className="w-8 font-bold">北</span>
            <Dropdown
              defaultOption={SELECT_PLAYER_DEFAULT_TEXT}
              options={options}
              onChange={onNorthPlayerChange}
            />
            <TextBox
              variant="number"
              type="number"
              placeholder="点数"
              value={scores.fourth}
              onChange={handleScoreChange("fourth")}
            />
            <span className="font-bold">00点</span>
          </div>
        </div>
        <div className="flex flex-col px-24 gap-4">
          <Button variant="brand-primary" onClick={handleSubmit}>
            決定
          </Button>
          <Button variant="brand-secondary" onClick={handleBack}>
            戻る
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlayerSelectPage;
