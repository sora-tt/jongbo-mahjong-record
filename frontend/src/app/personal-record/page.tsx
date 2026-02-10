"use client";

import * as React from "react";

import Header from "@/components/common/container/header";
import { AverageRankCard } from "@/components/pages/personal-record/average-rank-card";
import { TopTwoRateCard } from "@/components/pages/personal-record/top-two-rate-card";
import { TotalMatchCard } from "@/components/pages/personal-record/total-match-card";
import { TotalPointCard } from "@/components/pages/personal-record/total-point-card";

import { usePersonalRecord } from "./hooks";

const PersonalRecordPage: React.FC = () => {
  const {
    userName,
    joiningLeagueSeasons,
    selectedLeagueSeasonId,
    selectedLeagueSeasonMember,
    onChangeLeagueSeason,
    onDisplayButtonClick,
  } = usePersonalRecord();

  return (
    <div className="flex-1 bg-white min-h-screen font-jp">
      <Header />
      <div className="flex flex-col max-w-7xl gap-4 mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-2xl font-bold text-text-dark">
          {userName}さんの個人記録
        </div>
        <div className="flex flex-col gap-2">
          <div className="font-bold text-xl text-gray-500">シーズン選択</div>
          <div className="flex flex-row gap-2">
            <select
              className="w-full border border-gray-300 rounded-md p-2 text-text-dark"
              value={selectedLeagueSeasonId}
              onChange={onChangeLeagueSeason}
            >
              <option value="">シーズンを選択してください</option>
              {joiningLeagueSeasons &&
                joiningLeagueSeasons.map((leagueSeason) => (
                  <option key={leagueSeason.id} value={leagueSeason.id}>
                    {leagueSeason.name}
                  </option>
                ))}
            </select>
            <div className="flex">
              <button
                className="w-12 bg-brand-500 rounded text-white justify-center items-center"
                onClick={onDisplayButtonClick}
              >
                表示
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-1">
          <TotalMatchCard
            selectedLeagueSeasonMember={selectedLeagueSeasonMember}
          />
          <TotalPointCard
            selectedLeagueSeasonMember={selectedLeagueSeasonMember}
          />
          <AverageRankCard
            selectedLeagueSeasonMember={selectedLeagueSeasonMember}
          />
          <TopTwoRateCard
            selectedLeagueSeasonMember={selectedLeagueSeasonMember}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="font-bold text-xl text-gray-500">各順位回数</div>
          <div className="text-base font-bold text-text-dark rounded-md overflow-hidden border border-gray-300">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border-b border-gray-300 text-left">
                    順位
                  </th>
                  <th className="py-2 px-4 border-b border-gray-300 text-left">
                    回数
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-4 border-b border-gray-300">1位</td>
                  <td className="py-2 px-4 border-b border-gray-300">
                    {selectedLeagueSeasonMember?.numberOfEachOrder?.first ??
                      "-"}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border-b border-gray-300">2位</td>
                  <td className="py-2 px-4 border-b border-gray-300">
                    {selectedLeagueSeasonMember?.numberOfEachOrder?.second ??
                      "-"}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border-b border-gray-300">3位</td>
                  <td className="py-2 px-4 border-b border-gray-300">
                    {selectedLeagueSeasonMember?.numberOfEachOrder?.third ??
                      "-"}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4">4位</td>
                  <td className="py-2 px-4">
                    {selectedLeagueSeasonMember?.numberOfEachOrder?.fourth ??
                      "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalRecordPage;
