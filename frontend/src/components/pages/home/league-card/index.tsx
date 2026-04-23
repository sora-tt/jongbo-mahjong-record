import * as React from "react";

import { FileText, Pencil, Trophy, Users } from "lucide-react";

import Link from "next/link";

type Props = {
  leagueId: string;
  leagueName: string;
  memberCount: number;
  totalMatchCount: number;
  activeSeason: {
    id: string;
    name: string;
  } | null;
  myRank: number | null;
};

const LeagueCard: React.FC<Props> = ({
  leagueId,
  leagueName,
  memberCount,
  totalMatchCount,
  activeSeason,
  myRank,
}) => {
  return (
    <div className="bg-white rounded-lg border-2 border-brand-200 hover:shadow-lg transition-shadow duration-200 overflow-hidden min-h-[260px]">
      <div className="bg-gradient-to-r from-brand-500 to-brand-400 p-6">
        <h2 className="text-xl font-bold text-white mb-2">{leagueName}</h2>
        <div className="flex items-center space-x-4 text-white text-sm">
          <div className="flex items-center">
            <Users size={16} className="mr-1" />
            <span>{memberCount}人</span>
          </div>
          <div className="flex items-center">
            <Trophy size={16} className="mr-1" />
            <span>{totalMatchCount}局</span>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 gap-6 items-stretch">
        <div className="flex flex-col h-full">
          {activeSeason && (
            <p className="mb-2 text-lg font-semibold text-brand-500">
              {activeSeason.name}
            </p>
          )}
          <h3 className="text-base font-semibold text-text-muted mb-3">
            リーグ順位
          </h3>
          <div className="flex-1 flex items-end justify-center pb-2">
            <span className="font-extrabold text-brand-600 leading-none">
              {myRank === null ? (
                <span className="text-2xl align-baseline">集計待ち</span>
              ) : (
                <>
                  <span className="text-6xl align-baseline">{myRank}</span>
                  <span className="text-4xl align-baseline ml-1">位</span>
                </>
              )}
            </span>
          </div>
        </div>

        <div className="flex flex-col h-full gap-3">
          <Link
            href={`/league/${leagueId}`}
            className="w-full px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors duration-150 flex items-center justify-center gap-2"
          >
            <FileText size={18} />
            <span>リーグ詳細</span>
          </Link>

          <Link
            href={
              activeSeason
                ? `/league/${leagueId}/season/${activeSeason.id}`
                : `/league/${leagueId}`
            }
            className="w-full px-4 py-3 border-2 border-brand-500 text-brand-600 font-medium rounded-lg hover:bg-brand-50 transition-colors duration-150 flex items-center justify-center gap-2"
          >
            <Pencil size={18} />
            <span>シーズン詳細</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LeagueCard;
