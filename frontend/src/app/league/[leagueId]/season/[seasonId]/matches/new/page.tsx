"use client";

import * as React from "react";

import { Button } from "@/components/ui/button/index";
import { Dropdown } from "@/components/ui/dropdown/index";
import { TextBox } from "@/components/ui/text-box/index";

import { useRecordMatchPage } from "./hooks";

const SELECT_PLAYER_DEFAULT_TEXT = "プレイヤーを選択";

const NewMatchPage: React.FC = () => {
  const {
    players,
    options,
    scores,
    isLoading,
    isSubmitting,
    error,
    onEastPlayerChange,
    onSouthPlayerChange,
    onWestPlayerChange,
    onNorthPlayerChange,
    handleScoreChange,
    handleSubmit,
    handleBack,
  } = useRecordMatchPage();

  if (isLoading) {
    return (
      <div className="flex-1 bg-white min-h-screen font-jp">
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center text-text-muted">
          対局記録画面を読み込んでいます...
        </div>
      </div>
    );
  }

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
              value={players.east}
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
              value={players.south}
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
              value={players.west}
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
              value={players.north}
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
          {error && (
            <p className="text-sm text-error-text text-center">{error}</p>
          )}
        </div>
        <div className="flex flex-col px-24 gap-4">
          <Button
            variant="brand-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "保存中..." : "決定"}
          </Button>
          <Button variant="brand-secondary" onClick={handleBack}>
            戻る
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewMatchPage;
