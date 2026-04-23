import * as React from "react";

import { Plus, Trophy } from "lucide-react";

import Link from "next/link";

const EmptyLeagueState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-24  text-center">
      <Trophy size={56} className="text-brand-300 mb-4" />
      <h2 className="text-xl font-semibold text-text-dark mb-2">
        まだリーグに参加していません
      </h2>
      <p className="text-text-muted mb-6">
        新しいリーグを作成して、友達と記録を共有しましょう！
      </p>
      <Link
        href="/league/new"
        className="flex items-center gap-2 px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors duration-150"
      >
        <Plus size={20} />
        <span>新しいリーグを作成</span>
      </Link>
    </div>
  );
};

export default EmptyLeagueState;
