import * as React from "react";

import { FileText, Pencil, Trophy, Users } from "lucide-react";

import { useLeagueCard } from "./hooks";

type Props = {
  userId: string;
  leagueId: string;
};

const LeagueCard: React.FC<Props> = ({ userId, leagueId }) => {
  const { leagueName, memberCount, gameCount, myRank } = useLeagueCard(
    userId,
    leagueId
  );

  return (
    <div className="bg-white rounded-lg border-2 border-brand-200 hover:shadow-lg transition-shadow duration-200 overflow-hidden min-h-[260px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-400 p-6">
        <h2 className="text-xl font-bold text-white mb-2">{leagueName}</h2>
        <div className="flex items-center space-x-4 text-white text-sm">
          <div className="flex items-center">
            <Users size={16} className="mr-1" />
            <span>{memberCount}人</span>
          </div>
          <div className="flex items-center">
            <Trophy size={16} className="mr-1" />
            <span>{gameCount}局</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 grid grid-cols-2 gap-6 items-stretch">
        <div className="flex flex-col h-full">
          <h3 className="text-base font-semibold text-text-muted mb-3">
            リーグ順位
          </h3>
          <div className="flex-1 flex items-end justify-center pb-2">
            <span className="font-extrabold text-brand-600 leading-none">
              <span className="text-6xl align-baseline">{myRank}</span>
              <span className="text-4xl align-baseline ml-1">位</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col h-full gap-3">
          <button className="w-full px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors duration-150 flex items-center justify-center gap-2">
            <FileText size={18} />
            <span>詳細を見る</span>
          </button>

          <button className="w-full px-4 py-3 border-2 border-brand-500 text-brand-600 font-medium rounded-lg hover:bg-brand-50 transition-colors duration-150 flex items-center justify-center gap-2">
            <Pencil size={18} />
            <span>記録する</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeagueCard;
