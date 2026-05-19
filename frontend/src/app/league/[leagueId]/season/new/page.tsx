"use client";

import * as React from "react";

import { ArrowLeft, CalendarRange, Check, Type, Users } from "lucide-react";

import Link from "next/link";

import Header from "@/components/common/container/header";
import { Spacer } from "@/components/common/ui/spacer";
import { Button } from "@/components/ui/button";
import { InputArea } from "@/components/ui/input-area";

import { useSeasonNew } from "./hooks";

const SeasonNewPage: React.FC = () => {
  const {
    leagueId,
    leagueName,
    leagueMembers,
    selectedMembers,
    seasonName,
    loading,
    isSubmitting,
    error,
    handleMemberToggle,
    handleSeasonNameChange,
    handleSubmit,
  } = useSeasonNew();

  if (loading) {
    return (
      <Spacer className="min-h-screen bg-white">
        <Header />
        <Spacer className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4 text-center text-text-muted">
          シーズン作成画面を読み込んでいます...
        </Spacer>
      </Spacer>
    );
  }

  return (
    <Spacer className="min-h-screen">
      <Header />

      <Spacer
        display="flex"
        gap="small"
        padding="medium"
        className="bg-white text-black flex-col"
      >
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
          <h1 className="font-bold text-xl">シーズン作成</h1>
        </Spacer>

        <Spacer
          display="flex"
          gap="small"
          padding="medium"
          rounded="lg"
          border={{ color: "brand-200", width: "2" }}
          className="w-full flex-col"
        >
          <Spacer className="space-y-1">
            <p className="text-sm font-semibold text-gray-700">対象リーグ</p>
            <p className="text-sm text-text-muted">{leagueName}</p>
          </Spacer>

          <InputArea
            label="シーズン名"
            icon={<Type className="h-4 w-4" />}
            placeholder="例: 2026シーズン"
            labelClassName="font-semibold text-gray-700"
            value={seasonName}
            onChange={handleSeasonNameChange}
          />

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

            <Spacer className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <Spacer className="max-h-64 overflow-y-auto p-4">
                <Spacer className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {leagueMembers.map((member) => {
                    const isSelected = member.userId in selectedMembers;

                    return (
                      <label
                        key={member.userId}
                        className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${
                          isSelected
                            ? "border-brand-500 bg-gradient-to-br bg-brand-50 shadow-md"
                            : "border-gray-200 bg-white hover:border-brand-300 hover:shadow-sm"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleMemberToggle(member.userId)}
                          className="peer sr-only"
                        />
                        <Spacer
                          display="flex"
                          className="items-center justify-center p-3"
                        >
                          <span className="text-xs font-semibold text-gray-900">
                            {member.userName}
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

            {error ? (
              <Spacer className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </Spacer>
            ) : null}

            <Spacer
              display="flex"
              gap="small"
              className="items-center flex-col"
            >
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "作成中..." : "シーズンを作成"}
              </Button>

              <Spacer padding={{ top: "xxsmall" }} className="text-center">
                <Link
                  href={leagueId ? `/league/${leagueId}` : "/league"}
                  className="
                    inline-flex items-center gap-2
                    text-sm font-medium
                    text-gray-400
                    transition-colors
                    hover:text-gray-600
                  "
                >
                  <ArrowLeft className="h-4 w-4" />
                  リーグへ戻る
                </Link>
              </Spacer>
            </Spacer>
          </Spacer>
        </Spacer>
      </Spacer>
    </Spacer>
  );
};

export default SeasonNewPage;
