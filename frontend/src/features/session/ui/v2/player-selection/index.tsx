import * as React from "react";

import { Button } from "@/components/v2/ui/button";
import { Select } from "@/components/v2/ui/select";

import type { usePlayerSelect } from "@/features/session/hooks/use-player-select";
import type { Wind } from "@/features/session-match/model/participants";

const WIND_LABELS: Record<Wind, string> = {
  east: "東",
  south: "南",
  west: "西",
  north: "北",
};

type Props = Pick<
  ReturnType<typeof usePlayerSelect>,
  | "requiredWinds"
  | "players"
  | "isSubmitting"
  | "canSubmit"
  | "getPositionOptions"
  | "onPlayerChange"
  | "handleSubmit"
>;

export const PlayerSelection = ({
  requiredWinds,
  players,
  isSubmitting,
  canSubmit,
  getPositionOptions,
  onPlayerChange,
  handleSubmit,
}: Props) => (
  <main className="mx-auto flex min-h-[calc(100dvh-60px-env(safe-area-inset-top))] max-w-[390px] flex-col justify-center px-8 py-8">
    <div className="space-y-4">
      {requiredWinds.map((wind) => (
        <div key={wind} className="flex items-center gap-3">
          <span className="w-[30px] shrink-0 text-center text-v2-heading-2 font-bold">
            {WIND_LABELS[wind]}
          </span>
          <Select
            label={`${WIND_LABELS[wind]}のプレイヤー`}
            labelClassName="sr-only"
            containerClassName="min-w-0 flex-1"
            value={players[wind]}
            onChange={(event) =>
              onPlayerChange(wind)?.(event, event.target.value)
            }
            disabled={isSubmitting}
          >
            <option value="">プレイヤーを選択</option>
            {getPositionOptions(wind).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      ))}
    </div>
    <div className="mt-8 flex flex-col items-center gap-3 px-5">
      <Button
        size="lg"
        fullWidth
        onClick={handleSubmit}
        disabled={!canSubmit}
        loading={isSubmitting}
      >
        決定
      </Button>
    </div>
  </main>
);
