import * as React from "react";

import {
  addYakumanEvent,
  removeYakumanEvent,
  setYakumanEnabled,
} from "@/features/session-match/model/match-form";
import { YAKUMAN_OPTIONS } from "@/lib/yakuman";

import { Button } from "@/components/ui/button";
import { Control } from "@/components/ui/control";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";

import type {
  MatchFormValues,
  YakumanEntryError,
} from "@/features/session-match/model/match-form";
import type {
  ParticipantConstraint,
  SessionMember,
} from "@/features/session-match/model/participants";

export const OptionalRecords = ({
  values,
  constraint,
  members,
  chomboPenaltyPoints,
  allowOffTableKyotaku,
  yakumanErrors,
  disabled,
  onChange,
}: {
  values: MatchFormValues;
  constraint: ParticipantConstraint;
  members: ReadonlyArray<SessionMember>;
  chomboPenaltyPoints: number;
  allowOffTableKyotaku: boolean;
  yakumanErrors: ReadonlyArray<YakumanEntryError>;
  disabled: boolean;
  onChange: (values: MatchFormValues) => void;
}) => {
  const [showOffTable, setShowOffTable] = React.useState(
    () =>
      values.chomboOffenderUserIds.length > 0 || values.offTableKyotakuPresent
  );
  const selectedIds = new Set(
    constraint.requiredWinds
      .map((wind) => values.userIdByWind[wind])
      .filter(Boolean)
  );
  const winners = members.filter((member) =>
    selectedIds.has(String(member.userId))
  );
  const updateYakuman = (
    index: number,
    field: "winnerUserId" | "kind",
    value: string
  ) => {
    onChange({
      ...values,
      yakumanEvents: values.yakumanEvents.map((event, i) =>
        i === index ? { ...event, [field]: value || null } : event
      ),
    });
  };
  return (
    <Panel className="space-y-3">
      <h2 className="text-app-heading-2 font-bold">追加の記録</h2>
      <Control
        appearance="compact"
        className="flex min-h-12 items-center gap-3 text-app-label"
        label="役満記録を入力"
        checked={values.yakumanEnabled}
        disabled={disabled}
        onChange={(event) =>
          onChange(setYakumanEnabled(values, event.target.checked))
        }
      />
      {values.yakumanEnabled && (
        <div className="space-y-3">
          {values.yakumanEvents.map((event, index) => {
            const rowError = yakumanErrors.find(
              (entry) => entry.index === index
            );
            const errorId = `yakuman-error-${index}`;
            return (
              <div
                key={index}
                role="group"
                aria-label={`役満記録 ${index + 1}`}
                aria-describedby={rowError ? errorId : undefined}
                className="space-y-2 rounded-app-control bg-app-surface-subtle p-3"
              >
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    label="和了者"
                    value={event.winnerUserId ?? ""}
                    onChange={(e) =>
                      updateYakuman(index, "winnerUserId", e.target.value)
                    }
                    disabled={disabled}
                  >
                    <option value="">和了者を選択</option>
                    {winners.map((member) => (
                      <option
                        key={String(member.userId)}
                        value={String(member.userId)}
                      >
                        {member.userName}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="役満種"
                    value={event.kind ?? ""}
                    onChange={(e) =>
                      updateYakuman(index, "kind", e.target.value)
                    }
                    disabled={disabled}
                  >
                    <option value="">役満種を選択</option>
                    {YAKUMAN_OPTIONS.map((option) => (
                      <option key={option.kind} value={option.kind}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="tertiary"
                    size="sm"
                    className="!border-0 !px-0"
                    aria-label={`役満記録 ${index + 1} を削除`}
                    disabled={disabled}
                    onClick={() => onChange(removeYakumanEvent(values, index))}
                  >
                    削除
                  </Button>
                </div>
                {rowError && (
                  <p
                    id={errorId}
                    role="alert"
                    className="text-app-caption text-app-danger"
                  >
                    {rowError.message}
                  </p>
                )}
              </div>
            );
          })}
          {values.yakumanEvents.length > 0 &&
            values.yakumanEvents.every((event) =>
              Boolean(event.winnerUserId && event.kind)
            ) && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={disabled}
                onClick={() => onChange(addYakumanEvent(values))}
              >
                ＋ 役満を追加
              </Button>
            )}
        </div>
      )}
      <Control
        appearance="compact"
        className="flex min-h-12 items-center gap-3 text-app-label"
        label="外卓記録を入力"
        checked={showOffTable}
        disabled={disabled}
        onChange={(event) => {
          const checked = event.target.checked;
          setShowOffTable(checked);
          if (!checked)
            onChange({
              ...values,
              chomboOffenderUserIds: [],
              offTableKyotakuPresent: false,
              offTableKyotakuCount: "",
            });
        }}
      />
      {showOffTable && (
        <div className="space-y-3 rounded-app-control bg-app-surface-subtle p-3">
          <p className="text-app-caption text-app-text-secondary">
            チョンボ罰符：{chomboPenaltyPoints} pt／回
          </p>
          <Control
            appearance="compact"
            className="flex min-h-11 items-center gap-3 text-app-label"
            label="チョンボが発生した"
            checked={values.chomboOffenderUserIds.length > 0}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                ...values,
                chomboOffenderUserIds: event.target.checked ? [""] : [],
              })
            }
          />
          {values.chomboOffenderUserIds.map((id, index) => (
            <div key={index} className="flex items-end gap-2">
              <Select
                label="チョンボした人"
                containerClassName="min-w-0 flex-1"
                value={id}
                disabled={disabled}
                onChange={(event) => {
                  const ids = [...values.chomboOffenderUserIds];
                  ids[index] = event.target.value;
                  onChange({ ...values, chomboOffenderUserIds: ids });
                }}
              >
                <option value="">プレイヤーを選択</option>
                {members.map((member) => (
                  <option
                    key={String(member.userId)}
                    value={String(member.userId)}
                  >
                    {member.userName}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                disabled={disabled}
                className="!border-0"
                aria-label={`チョンボ記録 ${index + 1} を削除`}
                onClick={() =>
                  onChange({
                    ...values,
                    chomboOffenderUserIds: values.chomboOffenderUserIds.filter(
                      (_, i) => i !== index
                    ),
                  })
                }
              >
                削除
              </Button>
            </div>
          ))}
          {values.chomboOffenderUserIds.length > 0 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled}
              onClick={() =>
                onChange({
                  ...values,
                  chomboOffenderUserIds: [...values.chomboOffenderUserIds, ""],
                })
              }
            >
              チョンボ発生を追加
            </Button>
          )}
          {(allowOffTableKyotaku || values.offTableKyotakuPresent) && (
            <Control
              appearance="compact"
              className="flex min-h-11 items-center gap-3 text-app-label"
              label="卓外へ供託がある"
              checked={values.offTableKyotakuPresent}
              disabled={disabled}
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
          )}
          {values.offTableKyotakuPresent && (
            <Input
              label="供託本数"
              type="text"
              inputMode="numeric"
              value={values.offTableKyotakuCount}
              onChange={(event) =>
                onChange({
                  ...values,
                  offTableKyotakuCount: event.target.value,
                })
              }
              disabled={disabled}
            />
          )}
        </div>
      )}
    </Panel>
  );
};
