import * as React from "react";

import { Chip } from "@/components/v2/ui/chip";
import { Control } from "@/components/v2/ui/control";

type Member = { userId: string; userName: string };
type Props = {
  members: readonly Member[];
  selectedIds: readonly string[];
  lockedIds?: readonly string[];
  onToggle: (id: string) => void;
  disabled?: boolean;
};
export const SeasonMembers = ({
  members,
  selectedIds,
  lockedIds = [],
  onToggle,
  disabled,
}: Props) => (
  <div>
    {members.map((member) => {
      const checked =
        selectedIds.includes(member.userId) ||
        lockedIds.includes(member.userId);
      const locked = lockedIds.includes(member.userId);
      return (
        <Control
          key={member.userId}
          className="flex min-h-[58px] items-center gap-4 border-b border-v2-border-subtle py-2 last:border-0"
          appearance="compact"
          checked={checked}
          disabled={disabled || locked}
          onChange={() => onToggle(member.userId)}
          aria-label={`${member.userName}を選択`}
          label={
            <>
              <span className="min-w-0 flex-1 text-v2-label font-semibold">
                {member.userName}
              </span>
              <Chip
                variant={checked ? "selected" : "neutral"}
                size="sm"
                className="min-w-[82px]"
              >
                {checked ? "参加中" : "未選択"}
              </Chip>
            </>
          }
        />
      );
    })}
  </div>
);
