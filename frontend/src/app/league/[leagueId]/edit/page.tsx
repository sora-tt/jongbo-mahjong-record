"use client";

import * as React from "react";

import { ArrowLeft, Plus, Trash2, Trophy, Type, Users } from "lucide-react";

import Link from "next/link";

import Header from "@/components/common/container/header";
import { Spacer } from "@/components/common/ui/spacer";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { InputArea } from "@/components/ui/input-area";

import { useLeagueEdit } from "./hooks";

import type { RuleIdType } from "@/types/domain/rule";
import type { UserIdType } from "@/types/domain/user";

const RULE_SELECT_DEFAULT_TEXT = "プリセットから選択…";

const EditLeaguePage: React.FC = () => {
  const {
    leagueName,
    memberQuery,
    addedMembers,
    selectedRule,
    addedRules,
    ruleOptions,
    handleLeagueNameChange,
    handleMemberQueryChange,
    handleAddMember,
    handleRemoveMember,
    handleRuleSelectChange,
    handleAddRule,
    handleRemoveRule,
    handleSubmit,
  } = useLeagueEdit();

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
          <h1 className="font-bold text-xl">リーグ設定変更</h1>
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

          {/* メンバー */}
          <Spacer className="space-y-2">
            <Spacer display="flex" className="items-end justify-between">
              <Spacer>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Users className="h-4 w-4" />
                  メンバー
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  現在のメンバーです。メンバーIDを入力して「追加」を押すと、下にメンバーが増えていきます
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
                      onClick={() => handleRemoveMember(id as UserIdType)}
                      className="text-[10px] font-semibold text-brand-500 hover:text-brand-700"
                      aria-label="メンバーを削除"
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

            <Spacer display="flex" gap="small">
              <Dropdown
                defaultOption={RULE_SELECT_DEFAULT_TEXT}
                options={ruleOptions}
                value={selectedRule ?? ""}
                onChange={handleRuleSelectChange}
              />

              <Button
                variant="brand-primary"
                onClick={handleAddRule}
                disabled={!selectedRule}
              >
                <Plus className="h-4 w-4" /> 追加
              </Button>
            </Spacer>

            {/* ルール一覧 */}
            {Object.keys(addedRules).length > 0 ? (
              <Spacer
                display="flex"
                className="flex-col"
                gap="small"
                padding={{ top: "small" }}
              >
                <h3 className="text-sm font-semibold text-brand-700">
                  選択中のルール
                </h3>

                {Object.entries(addedRules).map(([id, rule]) => (
                  <Spacer
                    key={id}
                    className="
                      rounded-xl border border-brand-200
                      bg-gradient-to-r from-brand-50 to-brand-100
                      p-4 transition-all
                      hover:border-brand-300 hover:shadow-md hover:shadow-brand-200
                    "
                  >
                    {/* 上段：ルール名 + バッジ + 削除ボタン */}
                    <Spacer
                      display="flex"
                      className="items-center justify-between gap-2"
                    >
                      <Spacer display="flex" className="items-center gap-2">
                        <h4 className="text-sm font-semibold text-brand-800">
                          {rule.name}
                        </h4>

                        <span
                          className={`
                            inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold
                            ${
                              rule.mode === "sanma"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            }
                          `}
                        >
                          {rule.mode === "sanma" ? "三人麻雀" : "四人麻雀"}
                        </span>
                      </Spacer>

                      {/* 削除ボタン（brand 色ベース） */}
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(id as RuleIdType)}
                        className="
              inline-flex items-center justify-center
              h-7 w-7 rounded-full
              text-brand-500 hover:text-brand-700
              hover:bg-white/70
              transition-colors
            "
                        aria-label="ルールを削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Spacer>

                    {/* 下段：説明 + 詳細 */}
                    <Spacer className="mt-2 space-y-1">
                      {rule.description && (
                        <p className="text-xs text-brand-700">
                          {rule.description}
                        </p>
                      )}

                      <Spacer className="space-y-0.5">
                        <p className="text-xs text-brand-600">
                          <span className="font-semibold text-brand-700">
                            オカ：
                          </span>
                          {rule.oka.startPoints.toLocaleString()} 点持ち /
                          {rule.oka.returnPoints.toLocaleString()} 点返し
                        </p>

                        <p className="text-xs text-brand-600">
                          <span className="font-semibold text-brand-700">
                            ウマ：
                          </span>
                          {Object.entries(rule.uma).map(([rank, points]) => {
                            const label = `${rank}位`;
                            const value =
                              points > 0
                                ? `+${points}`
                                : points === 0
                                  ? "±0"
                                  : `${points}`;

                            return (
                              <span key={rank} className="mr-2">
                                {label} {value}
                              </span>
                            );
                          })}
                        </p>

                        <p className="text-xs text-brand-600">
                          <span className="font-semibold text-brand-700">
                            点数計算：
                          </span>
                          {rule.scoreCalc === "decimal" && "小数点有効"}
                          {rule.scoreCalc === "fiveDropSixUp" && "五捨六入"}
                          {rule.scoreCalc === "round" && "四捨五入"}
                          {rule.scoreCalc === "floor" && "切り捨て"}
                          {rule.scoreCalc === "ceil" && "切り上げ"}
                        </p>
                      </Spacer>
                    </Spacer>
                  </Spacer>
                ))}
              </Spacer>
            ) : (
              <Spacer className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-2 py-4 text-center">
                <Trophy className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm font-medium text-gray-600">
                  ルールを選択して追加してください
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  選択したルールの詳細がここに表示されます
                </p>
              </Spacer>
            )}
          </Spacer>

          {/* アクションボタン */}
          <Spacer
            display="flex"
            gap="small"
            className="items-center flex-col pt-2"
          >
            <Button variant="brand-primary" size="lg" onClick={handleSubmit}>
              変更を適用
            </Button>

            <Spacer className="text-center">
              <Link
                href="/home"
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

export default EditLeaguePage;
