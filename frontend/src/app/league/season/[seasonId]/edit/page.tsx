"use client";

import * as React from "react";

import { ArrowLeft, CalendarRange, Check, Type, Users } from "lucide-react";

import Link from "next/link";

import Header from "@/components/common/container/header";
import { Spacer } from "@/components/common/ui/spacer";
import { Button } from "@/components/ui/button";
import { InputArea } from "@/components/ui/input-area";

import { useSeasonEdit } from "./hooks";

import type { UserIdType } from "@/types/domain/user";

const SeasonEditPage: React.FC = () => {
  const {
    leagueId,
    seasonId,
    leagueMembers,
    selectedMembers,
    seasonName,
    handleMemberToggle,
    handleSeasonNameChange,
    handleSubmit,
  } = useSeasonEdit();

  return (
    <Spacer className="min-h-screen">
      <Header />

      <Spacer
        display="flex"
        gap="small"
        padding="medium"
        className="bg-white text-black flex-col"
      >
        {/* タイトル */}
        <Spacer display="flex" gap="xxsmall" className="items-center">
          <Spacer
            display="flex"
            height="8"
            width="8"
            rounded="lg"
            className="items-center justify-center bg-gradient-to-br from-brand-200 to-brand-400 shadow-lg"
          >
            <CalendarRange className="h-4 w-4 text-white" />
          </Spacer>
          <h1 className="font-bold text-xl">シーズン設定変更</h1>
        </Spacer>

        {/* カード本体 */}
        <Spacer
          display="flex"
          gap="small"
          padding="medium"
          rounded="lg"
          border={{ color: "brand-200", width: "2" }}
          className="w-full flex-col"
        >
          {/* シーズン名入力 */}
          <InputArea
            label="シーズン名"
            icon={<Type className="h-4 w-4" />}
            placeholder="例: 2026シーズン"
            labelClassName="font-semibold text-gray-700"
            value={seasonName}
            onChange={handleSeasonNameChange}
          />

          {/* 参加者セクション */}
          <Spacer className="space-y-2">
            <Spacer display="flex" className="items-end justify-between">
              <Spacer>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Users className="h-4 w-4" />
                  参加者
                </label>
              </Spacer>

              <Spacer
                display="flex"
                className="items-center gap-2 rounded-xl bg-gradient-to-r bg-brand-50 px-4 py-2 ring-1 ring-brand-200"
              >
                <Users className="h-4 w-4 text-brand-600" />
                <span className="text-sm font-semibold text-brand-700">
                  {Object.keys(selectedMembers).length} 人選択
                </span>
              </Spacer>
            </Spacer>

            {/* メンバー一覧 */}
            <Spacer className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <Spacer className="max-h-64 overflow-y-auto p-4">
                <Spacer className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {Object.entries(leagueMembers).map(([id, member]) => {
                    const isSelected = id in selectedMembers;

                    return (
                      <label
                        key={id}
                        className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${
                          isSelected
                            ? "border-brand-500 bg-gradient-to-br bg-brand-50 shadow-md"
                            : "border-gray-200 bg-white hover:border-brand-300 hover:shadow-sm"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleMemberToggle(id as UserIdType)}
                          className="peer sr-only"
                        />
                        <Spacer
                          display="flex"
                          className="items-center justify-center p-3"
                        >
                          <span className="text-xs font-semibold text-gray-900">
                            {member.player.name}
                          </span>
                        </Spacer>

                        {isSelected && (
                          <Spacer className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 shadow-sm">
                            <Check className="h-3.5 w-3.5 text-white" />
                          </Spacer>
                        )}
                      </label>
                    );
                  })}
                </Spacer>
              </Spacer>
            </Spacer>

            {/* ボタン類 */}
            <Spacer
              display="flex"
              gap="small"
              className="items-center flex-col"
            >
              {/* メインボタン */}
              <Button onClick={handleSubmit}>変更を適用</Button>

              {/* サブリンク */}
              <Spacer padding={{ top: "xxsmall" }} className="text-center">
                <Link
                  href={
                    leagueId
                      ? `/league/${leagueId}/season/${seasonId}`
                      : "/league"
                  }
                  className="
                    inline-flex items-center gap-2
                    text-sm font-medium
                    text-gray-400
                    transition-colors
                    hover:text-gray-600
                  "
                >
                  <ArrowLeft className="h-4 w-4" />
                  シーズンへ戻る
                </Link>
              </Spacer>
            </Spacer>
          </Spacer>
        </Spacer>
      </Spacer>
    </Spacer>
  );
};

export default SeasonEditPage;
