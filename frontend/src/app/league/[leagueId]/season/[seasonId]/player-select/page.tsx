"use client";

import * as React from "react";

import { Button } from "@/components/ui/button/index";
import { Dropdown } from "@/components/ui/dropdown/index";

import { usePlayerSelect } from "./hooks";

const SELECT_PLAYER_DEFAULT_TEXT = "プレイヤーを選択";

const PlayerSelectPage: React.FC = () => {
  const {
    players,
    isLoading,
    isSubmitting,
    error,
    canSubmit,
    handleSubmit,
    handleBack,
    onFirstPlayerChange,
    onSecondPlayerChange,
    onThirdPlayerChange,
    onFourthPlayerChange,
    firstOptions,
    secondOptions,
    thirdOptions,
    fourthOptions,
  } = usePlayerSelect();

  if (isLoading) {
    return (
      <div className="flex-1 bg-white min-h-screen font-jp">
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center text-text-muted">
          プレイヤー候補を読み込んでいます...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white min-h-screen font-jp">
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-text-dark mb-24">
          プレイヤー選択
        </h1>
        <div className="flex flex-col text-text-dark gap-4 mb-36">
          <div className="mb-2">
            <Dropdown
              defaultOption={SELECT_PLAYER_DEFAULT_TEXT}
              options={firstOptions}
              value={players.first}
              onChange={onFirstPlayerChange}
            />
          </div>
          <div className="mb-2">
            <Dropdown
              defaultOption={SELECT_PLAYER_DEFAULT_TEXT}
              options={secondOptions}
              value={players.second}
              onChange={onSecondPlayerChange}
            />
          </div>
          <div className="mb-2">
            <Dropdown
              defaultOption={SELECT_PLAYER_DEFAULT_TEXT}
              options={thirdOptions}
              value={players.third}
              onChange={onThirdPlayerChange}
            />
          </div>
          <div className="mb-2">
            <Dropdown
              defaultOption={SELECT_PLAYER_DEFAULT_TEXT}
              options={fourthOptions}
              value={players.fourth}
              onChange={onFourthPlayerChange}
            />
          </div>
          {error && (
            <p className="text-sm text-error-text text-center">{error}</p>
          )}
        </div>
        <div className="flex flex-col px-24 gap-4">
          <Button
            variant="brand-primary"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? "準備中..." : "決定"}
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
