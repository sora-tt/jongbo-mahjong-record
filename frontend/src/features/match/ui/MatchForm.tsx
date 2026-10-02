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
  chomboPenaltyPoints: number;
  allowOffTableKyotaku: boolean;
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
  chomboPenaltyPoints,
  allowOffTableKyotaku,
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

  const setChomboOffender = (index: number, offenderUserId: string) => {
    const chomboOffenderUserIds = [...values.chomboOffenderUserIds];
    chomboOffenderUserIds[index] = offenderUserId;
    onChange({ ...values, chomboOffenderUserIds });
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-center px-4 py-8 font-jp">
      <h1 className="mb-8 text-center text-2xl font-bold text-foreground">
        {title}
      </h1>

      <div className="space-y-4 rounded-surface border border-border bg-white p-5 shadow-sm">
        {mode === "edit" ? (
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
        ) : null}

        {constraint.requiredWinds.map((wind) => (
          <div
            key={wind}
            className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2"
          >
            <span className="font-bold text-foreground">
              {WIND_LABELS[wind]}
            </span>
            <Dropdown
              defaultOption="プレイヤーを選択"
              options={options}
              value={values.userIdByWind[wind] ?? ""}
              onChange={(_, value) => updateWind(wind, value)}
              disabled={isSubmitting || mode === "edit"}
              className="w-full"
            />
            <div className="flex items-center gap-2">
              <TextBox
                variant="number"
                type="text"
                inputMode="numeric"
                placeholder="点数"
                value={values.rawScoreByWind[wind]}
                onChange={(event) => updateScore(wind, event.target.value)}
                disabled={isSubmitting}
              />
              <span className="whitespace-nowrap text-sm font-bold text-foreground">
                00点
              </span>
            </div>
          </div>
        ))}

        {mode === "edit" ? (
          <section className="space-y-1 border-t border-border pt-3 text-sm">
            <h2 className="font-semibold text-foreground">外卓記録</h2>
            <p className="text-text-muted">
              チョンボ：
              {values.chomboOffenderUserIds.length > 0
                ? values.chomboOffenderUserIds
                    .map(
                      (userId) =>
                        members.find(
                          (member) => String(member.userId) === userId
                        )?.userName ?? "参加者"
                    )
                    .join("、")
                : "なし"}
              {values.chomboOffenderUserIds.length > 0
                ? `（${values.chomboOffenderUserIds.length}回）`
                : null}
            </p>
            <p className="text-text-muted">
              卓外供託：
              {values.offTableKyotakuPresent
                ? `${values.offTableKyotakuCount}本`
                : "なし"}
            </p>
            <p className="text-xs text-text-muted">
              チョンボ罰符 {chomboPenaltyPoints}pt／外卓記録は編集できません
            </p>
          </section>
        ) : (
          <section className="space-y-3 border-t border-border pt-3">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-foreground">
                外卓記録
              </h2>
              <p className="text-xs text-text-muted">
                チョンボ罰符：{chomboPenaltyPoints}pt／回
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={values.chomboOffenderUserIds.length > 0}
                disabled={isSubmitting}
                onChange={(event) =>
                  onChange({
                    ...values,
                    chomboOffenderUserIds: event.target.checked ? [""] : [],
                  })
                }
              />
              チョンボが発生した
            </label>
            {values.chomboOffenderUserIds.length > 0 ? (
              <div className="space-y-2 pl-1">
                {values.chomboOffenderUserIds.map((offenderUserId, index) => (
                  <div
                    key={`chombo-${index}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
                  >
                    <Dropdown
                      defaultOption="チョンボした人を選択"
                      options={options}
                      value={offenderUserId}
                      onChange={(_, value) => setChomboOffender(index, value)}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isSubmitting}
                      onClick={() =>
                        onChange({
                          ...values,
                          chomboOffenderUserIds:
                            values.chomboOffenderUserIds.filter(
                              (_, eventIndex) => eventIndex !== index
                            ),
                        })
                      }
                    >
                      削除
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() =>
                    onChange({
                      ...values,
                      chomboOffenderUserIds: [
                        ...values.chomboOffenderUserIds,
                        "",
                      ],
                    })
                  }
                >
                  チョンボ発生を追加
                </Button>
              </div>
            ) : null}

            {allowOffTableKyotaku ? (
              <div className="space-y-2 border-t border-border pt-3">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={values.offTableKyotakuPresent}
                    disabled={isSubmitting}
                    onChange={(event) =>
                      onChange({
                        ...values,
                        offTableKyotakuPresent: event.target.checked,
                        offTableKyotakuCount: event.target.checked
                          ? values.offTableKyotakuCount || "1"
                          : "",
                      })
                    }
                  />
                  卓外へ供託がある
                </label>
                {values.offTableKyotakuPresent ? (
                  <label className="block text-sm font-medium text-foreground">
                    卓外供託の本数
                    <TextBox
                      className="mt-1 max-w-32"
                      variant="number"
                      type="text"
                      inputMode="numeric"
                      value={values.offTableKyotakuCount}
                      onChange={(event) =>
                        onChange({
                          ...values,
                          offTableKyotakuCount: event.target.value,
                        })
                      }
                      disabled={isSubmitting}
                    />
                  </label>
                ) : null}
              </div>
            ) : null}
          </section>
        )}

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
