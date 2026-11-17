import * as React from "react";

import { Button } from "@/components/ui/button";
import { IconContainer } from "@/components/ui/icon-container";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

import type {
  SessionMember,
  Wind,
} from "@/features/session-match/model/participants";

const WIND_COLORS: Record<Wind, string> = {
  east: "!bg-[var(--app-rank-first)]",
  south: "!bg-[var(--app-rank-second)]",
  west: "!bg-[var(--app-rank-third)]",
  north: "!bg-app-brand-strong",
};

const WIND_LABELS: Record<Wind, string> = {
  east: "東",
  south: "南",
  west: "西",
  north: "北",
};

export const ScoreRow = ({
  wind,
  playerId,
  score,
  members,
  disabled,
  onPlayerChange,
  onScoreChange,
}: {
  wind: Wind;
  playerId: string | null;
  score: string;
  members: ReadonlyArray<SessionMember>;
  disabled: boolean;
  onPlayerChange: (wind: Wind, value: string) => void;
  onScoreChange: (wind: Wind, value: string) => void;
}) => {
  const negative = score.trimStart().startsWith("-");
  const unsigned = score.replace(/^(\s*)[-+]/, "$1");
  const setSign = (nextNegative: boolean) => {
    if (nextNegative === negative) return;
    const trimmed = unsigned.trimStart();
    const whitespace = unsigned.slice(0, unsigned.length - trimmed.length);
    onScoreChange(wind, `${whitespace}${nextNegative ? "-" : ""}${trimmed}`);
  };
  return (
    <div className="space-y-2 border-b border-app-border-subtle pb-4 last:border-0 last:pb-0">
      <div className="flex items-center gap-3">
        <IconContainer
          circle
          className={`${WIND_COLORS[wind]} !size-[30px] !text-app-on-primary font-bold`}
        >
          {WIND_LABELS[wind]}
        </IconContainer>
        <Select
          label={`${WIND_LABELS[wind]}のプレイヤー`}
          labelClassName="sr-only"
          containerClassName="min-w-0 flex-1"
          value={playerId ?? ""}
          onChange={(event) => onPlayerChange(wind, event.target.value)}
          disabled={disabled}
        >
          <option value="">プレイヤーを選択</option>
          {members.map((member) => (
            <option key={String(member.userId)} value={String(member.userId)}>
              {member.userName}
            </option>
          ))}
        </Select>
      </div>
      <div className="ml-[42px] flex items-end justify-end gap-2">
        <div className="shrink-0">
          <p className="mb-1 text-app-caption text-app-text-secondary">符号</p>
          <div
            className="relative isolate flex rounded-md bg-app-surface-subtle [&_button]:!border-transparent [&_button]:!bg-transparent"
            role="group"
            aria-label={`${WIND_LABELS[wind]}の符号`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 left-0 w-9 rounded-md bg-[var(--app-action-secondary)] transition-transform duration-200 ease-out motion-reduce:transition-none ${negative ? "translate-x-full" : "translate-x-0"} ${disabled ? "opacity-[0.48]" : ""}`}
            />
            <Button
              type="button"
              variant="selection"
              selected={!negative}
              aria-label={`${WIND_LABELS[wind]}をプラスにする`}
              className="relative !size-9 !rounded-md !px-0"
              disabled={disabled}
              onClick={() => setSign(false)}
            >
              ＋
            </Button>
            <Button
              type="button"
              variant="selection"
              selected={negative}
              aria-label={`${WIND_LABELS[wind]}をマイナスにする`}
              className="relative !size-9 !rounded-md !px-0"
              disabled={disabled}
              onClick={() => setSign(true)}
            >
              −
            </Button>
          </div>
        </div>
        <Input
          label="素点"
          aria-label={`${WIND_LABELS[wind]}の素点`}
          containerClassName="min-w-0 max-w-[100px] flex-1"
          className="text-center"
          type="text"
          inputMode="numeric"
          value={unsigned}
          onChange={(event) =>
            onScoreChange(
              wind,
              negative
                ? `-${event.target.value.replace(/^[-+]/, "")}`
                : event.target.value
            )
          }
          disabled={disabled}
        />
        <span className="shrink-0 pb-3 text-app-label font-semibold">00点</span>
      </div>
    </div>
  );
};
