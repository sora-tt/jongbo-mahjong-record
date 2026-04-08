"use client";

import * as React from "react";

import { ArrowLeft, Plus, Trophy, Type, Users } from "lucide-react";

import Link from "next/link";

import Header from "@/components/common/container/header";
import { Spacer } from "@/components/common/ui/spacer";
import { Button } from "@/components/ui/button";
import { InputArea } from "@/components/ui/input-area";

import { useLeagueNew } from "./hooks";

const NewLeaguePage: React.FC = () => {
  const {
    leagueName,
    memberQuery,
    addedMembers,
    ruleSettings,
    handleLeagueNameChange,
    handleMemberQueryChange,
    handleAddMember,
    handleRemoveMember,
    handleRuleSettingChange,
    handleSubmit,
  } = useLeagueNew();

  return (
    <Spacer className="min-h-screen bg-white flex flex-col">
      <Header />

      <Spacer
        display="flex"
        gap="small"
        padding="medium"
        className="flex-1 flex flex-col text-black"
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
            <Trophy className="h-4 w-4 text-white" />
          </Spacer>
          <h1 className="font-bold text-xl">リーグ作成</h1>
        </Spacer>

        <Spacer
          display="flex"
          gap="small"
          padding="medium"
          rounded="lg"
          border={{ color: "brand-200", width: "2" }}
          className="w-full max-w-3xl mx-auto flex flex-col"
        >
          {/* リーグ名 */}
          <InputArea
            label="リーグ名"
            icon={<Type className="h-4 w-4" />}
            placeholder="例: Mリーグ"
            labelClassName="font-semibold text-gray-700"
            value={leagueName}
            onChange={handleLeagueNameChange}
          />

          {/* メンバー追加 */}
          <Spacer className="space-y-2">
            <Spacer display="flex" className="items-end justify-between">
              <Spacer>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Users className="h-4 w-4" />
                  メンバー追加
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  メンバーIDを入力して「追加」を押すと、下にメンバーが増えていきます
                </p>
              </Spacer>

              <Spacer
                display="flex"
                className="items-center gap-2 rounded-xl bg-gradient-to-r from-brand-50 to-brand-50 px-5 py-1.5 ring-1 ring-brand-200"
              >
                <Users className="h-4 w-4 text-brand-600" />
                <span className="text-xs font-semibold text-brand-700 whitespace-nowrap">
                  {Object.keys(addedMembers).length} 人
                </span>
              </Spacer>
            </Spacer>

            {/* 入力 + ボタン */}
            <Spacer display="flex" gap="small">
              <input
                type="text"
                value={memberQuery}
                onChange={handleMemberQueryChange}
                placeholder="メンバーIDを入力（例: 0001）"
                className="flex-1 min-w-0 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
              />

              <Button
                variant="brand-primary"
                onClick={handleAddMember}
                disabled={!memberQuery.trim()}
              >
                <Plus className="h-4 w-4" /> 追加
              </Button>
            </Spacer>

            {/* 追加済みメンバー一覧 */}
            {Object.keys(addedMembers).length > 0 ? (
              <Spacer display="flex" className="flex-wrap gap-2 pt-1">
                {Object.entries(addedMembers).map(([id, user]) => (
                  <Spacer
                    key={id}
                    display="flex"
                    className="items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs"
                  >
                    <span className="font-semibold text-gray-800">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-gray-500">({id})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(id)}
                      className="text-[10px] font-semibold text-brand-500 hover:text-brand-700"
                    >
                      ×
                    </button>
                  </Spacer>
                ))}
              </Spacer>
            ) : (
              <Spacer className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-center">
                <p className="text-xs text-gray-500">
                  まだメンバーが追加されていません
                </p>
              </Spacer>
            )}
          </Spacer>

          {/* ルール設定 */}
          <Spacer className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Trophy className="h-4 w-4" />
              ルール設定
            </label>

            <Spacer className="space-y-3">
              {/* オカ設定 */}
              <Spacer className="space-y-2">
                <h3 className="text-sm font-semibold text-brand-700">
                  オカ設定
                </h3>
                <Spacer display="flex" gap="small" className="flex-wrap">
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      持ち点（点）
                    </label>
                    <input
                      type="number"
                      value={ruleSettings.okaStartPoints}
                      onChange={(e) =>
                        handleRuleSettingChange("okaStartPoints", e.target.value)
                      }
                      placeholder="例: 30000"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      返し点（点）
                    </label>
                    <input
                      type="number"
                      value={ruleSettings.okaReturnPoints}
                      onChange={(e) =>
                        handleRuleSettingChange("okaReturnPoints", e.target.value)
                      }
                      placeholder="例: 30000"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>
                </Spacer>
              </Spacer>

              {/* ウマ設定 */}
              <Spacer className="space-y-2">
                <h3 className="text-sm font-semibold text-brand-700">
                  ウマ設定
                </h3>
                <Spacer display="flex" gap="small" className="flex-wrap">
                  {(
                    [
                      { field: "uma1", label: "1位" },
                      { field: "uma2", label: "2位" },
                      { field: "uma3", label: "3位" },
                      { field: "uma4", label: "4位" },
                    ] as const
                  ).map(({ field, label }) => (
                    <div key={field} className="flex-1 min-w-0">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {label}
                      </label>
                      <input
                        type="number"
                        value={ruleSettings[field]}
                        onChange={(e) =>
                          handleRuleSettingChange(field, e.target.value)
                        }
                        placeholder="例: 15"
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>
                  ))}
                </Spacer>
              </Spacer>
            </Spacer>
          </Spacer>

          {/* アクションボタン */}
          <Spacer
            display="flex"
            gap="small"
            className="items-center flex-col pt-2"
          >
            <Button variant="brand-primary" size="lg" onClick={handleSubmit}>
              リーグを作成
            </Button>

            <Spacer className="text-center">
              <Link
                href="/leagues"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition-colors hover:text-gray-600"
              >
                <ArrowLeft className="h-4 w-4" />
                リーグ一覧へ戻る
              </Link>
            </Spacer>
          </Spacer>
        </Spacer>
      </Spacer>
    </Spacer>
  );
};

export default NewLeaguePage;
