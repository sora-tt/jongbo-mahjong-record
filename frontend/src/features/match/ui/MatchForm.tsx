import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { TextBox } from "@/components/ui/text-box";

import type {
  MatchFormValues,
  MatchFormMode,
} from "@/features/session-match/model/match-form";
import type {
  ParticipantConstraint,
  SessionMember,
  Wind,
} from "@/features/session-match/model/participants";

const WIND_LABELS: Record<Wind, string> = {
  east: "東",
  south: "南",
  west: "西",
  north: "北",
};

const formatDateTimeLocal = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

type Props = {
  mode: MatchFormMode;
  values: MatchFormValues;
  constraint: ParticipantConstraint;
  members: ReadonlyArray<SessionMember>;
  error: string | null;
  isSubmitting: boolean;
  onChange: (values: MatchFormValues) => void;
  onSubmit: () => void;
  onBack: () => void;
};

export const MatchForm: React.FC<Props> = ({
  mode,
  values,
  constraint,
  members,
  error,
  isSubmitting,
  onChange,
  onSubmit,
  onBack,
}) => {
  const options = members.map((member) => ({
    label: member.userName,
    value: String(member.userId),
  }));
  const title =
    mode === "edit"
      ? "対局編集"
      : mode === "additional"
        ? "対局を追加"
        : "対局記録";

  const updateWind = (wind: Wind, value: string) => {
    const selectedValue = value || null;
    const duplicateWind = constraint.requiredWinds.find(
      (currentWind) =>
        currentWind !== wind &&
        values.userIdByWind[currentWind] === selectedValue &&
        selectedValue !== null
    );

    onChange({
      ...values,
      userIdByWind: {
        ...values.userIdByWind,
        [wind]: selectedValue,
        ...(duplicateWind
          ? { [duplicateWind]: values.userIdByWind[wind] }
          : {}),
      },
    });
  };

  const updateScore = (wind: Wind, value: string) => {
    onChange({
      ...values,
      rawScoreByWind: { ...values.rawScoreByWind, [wind]: value },
    });
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-center px-4 py-8 font-jp">
      <h1 className="mb-8 text-center text-2xl font-bold text-foreground">
        {title}
      </h1>

      <div className="space-y-4 rounded-surface border border-border bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium text-foreground">
          対局日時
          <TextBox
            className="mt-1"
            type="datetime-local"
            value={formatDateTimeLocal(values.playedAt)}
            onChange={(event) => {
              const value = event.target.value;
              onChange({
                ...values,
                playedAt: value ? new Date(value).toISOString() : "",
              });
            }}
            disabled={isSubmitting}
          />
        </label>

        {constraint.requiredWinds.map((wind) => (
          <div
            key={wind}
            className="grid grid-cols-[2rem_1fr_7rem] items-start gap-2"
          >
            <span className="pt-2 font-bold text-foreground">
              {WIND_LABELS[wind]}
            </span>
            <Dropdown
              defaultOption="プレイヤーを選択"
              options={options}
              value={values.userIdByWind[wind] ?? ""}
              onChange={(_, value) => updateWind(wind, value)}
              disabled={isSubmitting || mode === "edit"}
            />
            <TextBox
              variant="number"
              type="text"
              inputMode="numeric"
              placeholder="点数"
              value={values.rawScoreByWind[wind]}
              onChange={(event) => updateScore(wind, event.target.value)}
              disabled={isSubmitting}
            />
          </div>
        ))}

        <p className="text-xs text-text-muted">
          参加者はSession作成時に固定されます。別の参加者で記録する場合は新しいSessionを開始してください。
        </p>

        {error ? <p className="text-sm text-error-text">{error}</p> : null}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? "保存中…" : "保存する"}
          </Button>
          <Button variant="secondary" onClick={onBack} disabled={isSubmitting}>
            戻る
          </Button>
        </div>
      </div>
    </div>
  );
};
