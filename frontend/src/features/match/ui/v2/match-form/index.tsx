import * as React from "react";

import { OptionalRecords } from "@/features/match/ui/v2/optional-records";
import { ScoreRow } from "@/features/match/ui/v2/score-row";

import { Button } from "@/components/v2/ui/button";
import { Chip } from "@/components/v2/ui/chip";
import { Input } from "@/components/v2/ui/input";
import { Panel } from "@/components/v2/ui/panel";
import { Status } from "@/components/v2/ui/status";

import type {
  MatchFormMode,
  MatchFormValues,
  YakumanEntryError,
} from "@/features/session-match/model/match-form";
import type {
  ParticipantConstraint,
  SessionMember,
  Wind,
} from "@/features/session-match/model/participants";

const formatDateTimeLocal = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const MatchForm = ({
  mode,
  values,
  constraint,
  members,
  chomboPenaltyPoints,
  allowOffTableKyotaku,
  error,
  yakumanErrors = [],
  isSubmitting,
  onChange,
  onSubmit,
  onBack,
}: {
  mode: MatchFormMode;
  values: MatchFormValues;
  constraint: ParticipantConstraint;
  members: ReadonlyArray<SessionMember>;
  chomboPenaltyPoints: number;
  allowOffTableKyotaku: boolean;
  error: string | null;
  yakumanErrors?: ReadonlyArray<YakumanEntryError>;
  isSubmitting: boolean;
  onChange: (values: MatchFormValues) => void;
  onSubmit: () => void;
  onBack: () => void;
}) => {
  const title =
    mode === "edit"
      ? "対局編集"
      : mode === "additional"
        ? "対局を追加"
        : "対局記録";
  const updateWind = (wind: Wind, value: string) => {
    const selected = value || null;
    const duplicate = constraint.requiredWinds.find(
      (other) =>
        other !== wind &&
        selected !== null &&
        values.userIdByWind[other] === selected
    );
    onChange({
      ...values,
      userIdByWind: {
        ...values.userIdByWind,
        [wind]: selected,
        ...(duplicate ? { [duplicate]: values.userIdByWind[wind] } : {}),
      },
    });
  };
  return (
    <main className="mx-auto max-w-[480px] space-y-4 px-4 pb-10 pt-5">
      <h1 className="text-center text-v2-display font-bold">{title}</h1>
      {mode === "additional" && (
        <div className="text-center">
          <Chip variant="selected" size="sm">
            Session · 対局を追加
          </Chip>
        </div>
      )}
      {mode === "edit" && (
        <Panel>
          <Input
            label="対局日時"
            type="datetime-local"
            value={formatDateTimeLocal(values.playedAt)}
            onChange={(event) =>
              onChange({
                ...values,
                playedAt: event.target.value
                  ? new Date(event.target.value).toISOString()
                  : "",
              })
            }
            disabled={isSubmitting}
          />
        </Panel>
      )}
      <Panel className="space-y-4">
        <h2 className="text-v2-heading-2 font-bold">素点入力</h2>
        {constraint.requiredWinds.map((wind) => (
          <ScoreRow
            key={wind}
            wind={wind}
            playerId={values.userIdByWind[wind]}
            score={values.rawScoreByWind[wind]}
            members={members}
            disabled={isSubmitting}
            playerDisabled={mode === "edit"}
            onPlayerChange={updateWind}
            onScoreChange={(w, value) =>
              onChange({
                ...values,
                rawScoreByWind: { ...values.rawScoreByWind, [w]: value },
              })
            }
          />
        ))}
      </Panel>
      <OptionalRecords
        values={values}
        constraint={constraint}
        members={members}
        chomboPenaltyPoints={chomboPenaltyPoints}
        allowOffTableKyotaku={allowOffTableKyotaku}
        yakumanErrors={yakumanErrors}
        disabled={isSubmitting}
        onChange={onChange}
      />
      {error && <Status message={error} />}
      <div className="flex flex-col items-center gap-3 px-6 pt-1">
        <Button size="lg" fullWidth onClick={onSubmit} loading={isSubmitting}>
          {mode === "edit" ? "変更を保存" : "対局結果を保存"}
        </Button>
        <Button
          variant="tertiary"
          className="!border-0 !font-normal"
          onClick={onBack}
          disabled={isSubmitting}
        >
          ← 戻る
        </Button>
      </div>
    </main>
  );
};
