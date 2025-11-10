import * as React from "react";

import { Plus, Trophy } from "lucide-react";

type Props = {
  hasLeagues?: boolean;
  onClick?: () => void;
};

const CreateLeagueCard: React.FC<Props> = ({ hasLeagues = true, onClick }) => {
  if (!hasLeagues) {
    // 「まだリーグに参加していません」表示
    return (
      <div className="md:col-span-2 lg:col-span-3">
        <div className="text-center py-16 bg-brand-50 rounded-lg border-2 border-dashed border-brand-300">
          <Trophy size={48} className="mx-auto text-brand-200 mb-4" />
          <p className="text-text-muted mb-6 text-lg">
            まだリーグに参加していません
          </p>
        </div>
      </div>
    );
  }

  // 新規リーグ作成ボタン風カード
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      className="bg-white rounded-lg border-2 border-dashed border-brand-200 hover:border-brand-500 hover:bg-brand-50 transition-all duration-200 cursor-pointer flex items-center justify-center min-h-[300px]"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-brand-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <Plus size={32} className="text-brand-600" />
        </div>
        <h3 className="font-bold text-brand-600 mb-2 text-lg">
          新しいリーグを作成
        </h3>
        <p className="text-sm text-text-muted">
          リーグを作成して友達を招待しましょう
        </p>
      </div>
    </div>
  );
};

export default CreateLeagueCard;
