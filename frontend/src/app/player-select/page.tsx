"use client";

import * as React from "react";

import Button from "@/components/ui/button/index";
import Dropdown from "@/components/ui/dropdown/index";

import { usePlayerSelect } from "./hooks";

const SELECT_PLAYER_DEFAULT_TEXT = "プレイヤーを選択";

const PlayerSelectPage: React.FC = () => {
  const { handleSubmit, handleBack, onPlayerChange, options } =
    usePlayerSelect();
  return (
    <div className="flex-1 bg-white min-h-screen font-jp">
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-text-dark mb-24">
          プレイヤー選択
        </h1>
        <div className="flex flex-col text-text-dark gap-4 mb-36">
          <Dropdown
            defaultOption={SELECT_PLAYER_DEFAULT_TEXT}
            options={options}
            label="東"
            onChange={onPlayerChange}
          />
          <Dropdown
            defaultOption={SELECT_PLAYER_DEFAULT_TEXT}
            options={options}
            label="南"
            onChange={onPlayerChange}
          />
          <Dropdown
            defaultOption={SELECT_PLAYER_DEFAULT_TEXT}
            options={options}
            label="西"
            onChange={onPlayerChange}
          />
          <Dropdown
            defaultOption={SELECT_PLAYER_DEFAULT_TEXT}
            options={options}
            label="北"
            onChange={onPlayerChange}
          />
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
