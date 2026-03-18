import * as React from "react";

import { Plus } from "lucide-react";

type Props = {
  onClick?: () => void;
};

const CreateLeagueCard: React.FC<Props> = ({ onClick }) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      className="bg-white rounded-lg border-2 border-dashed border-brand-200 hover:border-brand-500 hover:bg-brand-50 transition-all duration-200 cursor-pointer flex items-center justify-center min-h-[260px]"
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
