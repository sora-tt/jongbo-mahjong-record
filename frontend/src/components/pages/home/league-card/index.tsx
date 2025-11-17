import * as React from "react";

import { Trophy, Users } from "lucide-react";

import type { League } from "@/types/domain";

type Props = {
  league: League;
  recentScore?: string; // 例: "+12,000点"
};

const LeagueCard: React.FC<Props> = ({ league, recentScore = "+12,000点" }) => {
  return (
    <div className="bg-white rounded-lg border-2 border-brand-200 hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-400 p-6">
        <h2 className="text-xl font-bold text-white mb-2">{league.name}</h2>
        <div className="flex items-center space-x-4 text-white text-sm">
          <div className="flex items-center">
            <Users size={16} className="mr-1" />
            <span>{league.memberCount ?? 0}人</span>
          </div>
          <div className="flex items-center">
            <Trophy size={16} className="mr-1" />
            <span>{league.gameCount ?? 0}局</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-text-muted mb-3">
            最近の成績
          </h3>
          <div className="bg-brand-50 rounded-lg p-4 border border-brand-300">
            <div className="text-2xl font-bold text-brand-600 mb-1">
              {recentScore}
            </div>
            <p className="text-xs text-text-muted">直近5局の獲得点</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors duration-150"
            // TODO: onClickを設定
          >
            詳細を見る
          </button>
          <button
            className="flex-1 px-4 py-2 border-2 border-brand-500 text-brand-600 font-medium rounded-lg hover:bg-brand-50 transition-colors duration-150"
            // TODO: onClickを設定
          >
            記録する
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeagueCard;
