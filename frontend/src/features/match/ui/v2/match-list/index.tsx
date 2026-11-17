import * as React from "react";

import { Pencil, Trash2 } from "lucide-react";

import { MatchDetailsDialog } from "@/features/match/ui/v2/match-details-dialog";

import { Button } from "@/components/v2/ui/button";
import { EmptyState } from "@/components/v2/ui/empty-state";
import { IconButton } from "@/components/v2/ui/icon-button";
import { Panel } from "@/components/v2/ui/panel";
import { Table } from "@/components/v2/ui/table";

import type { toMatchList } from "@/features/match/model/adapter";

type Match = ReturnType<typeof toMatchList>[number];
type Player = { userId: string; userName: string };
const formatPoint = (point: number) =>
  `${point > 0 ? "+" : ""}${point.toFixed(1)}`;
const pointColor = (point: number) =>
  point > 0
    ? "text-blue-600"
    : point < 0
      ? "text-v2-danger"
      : "text-v2-text-secondary";

export const MatchList = ({
  players,
  matches,
  editable,
  deletingMatchId,
  onEdit,
  onDelete,
}: {
  players: readonly Player[];
  matches: readonly Match[];
  editable: boolean;
  deletingMatchId: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selectedMatch =
    matches.find((match) => String(match.id) === selectedId) ?? null;
  return (
    <>
      <Panel className="w-full min-w-0 overflow-hidden !p-0">
        <h2 className="sr-only">成績表</h2>
        {matches.length === 0 ? (
          <EmptyState
            title="まだ対局がありません"
            description="参加者と点数を入力して、最初の対局を記録してください。"
          />
        ) : (
          <div className="overflow-x-auto px-4 pb-4 pt-3">
            <Table
              plain
              className="min-w-[320px] table-fixed text-center text-v2-caption"
            >
              <thead className="bg-v2-brand-soft text-v2-text-secondary">
                <tr>
                  <th
                    scope="col"
                    className="h-9 w-10 rounded-l-[10px] font-semibold"
                  >
                    局
                  </th>
                  {players.map((player, index) => (
                    <th
                      key={String(player.userId)}
                      scope="col"
                      className={`overflow-hidden px-0.5 font-semibold ${!editable && index === players.length - 1 ? "rounded-r-[10px]" : ""}`}
                      title={player.userName}
                    >
                      <span className="block truncate">{player.userName}</span>
                    </th>
                  ))}
                  {editable && (
                    <th className="w-[72px] rounded-r-[10px]">
                      <span className="sr-only">操作</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {matches.map((match, index) => (
                  <tr
                    key={String(match.id)}
                    className={`h-12 cursor-pointer ${index < matches.length - 1 ? "border-b border-v2-border-subtle" : ""}`}
                    onClick={() => setSelectedId(String(match.id))}
                  >
                    <td>
                      <Button
                        variant="tertiary"
                        size="sm"
                        className="!h-12 !min-w-0 !rounded-none !border-0 !px-0 !text-v2-label !font-bold !text-v2-text"
                        aria-label={`対局 ${match.matchIndex} の詳細`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedId(String(match.id));
                        }}
                      >
                        #{match.matchIndex}
                      </Button>
                    </td>
                    {players.map((player) => {
                      const result = match.results.find(
                        (item) => String(item.userId) === String(player.userId)
                      );
                      return (
                        <td
                          key={String(player.userId)}
                          className={
                            result
                              ? "whitespace-nowrap px-0.5 text-v2-label font-semibold tabular-nums text-v2-text"
                              : "text-v2-text-secondary"
                          }
                        >
                          {result ? formatPoint(result.point) : "—"}
                        </td>
                      );
                    })}
                    {editable && (
                      <td>
                        <div className="flex justify-end">
                          <IconButton
                            variant="tertiary"
                            size="sm"
                            className="!border-0 !bg-transparent !text-v2-text-secondary"
                            aria-label={`対局 ${match.matchIndex} を編集`}
                            disabled={Boolean(deletingMatchId)}
                            onClick={(event) => {
                              event.stopPropagation();
                              onEdit(String(match.id));
                            }}
                          >
                            <Pencil size={18} aria-hidden="true" />
                          </IconButton>
                          <IconButton
                            variant="tertiary"
                            size="sm"
                            className="!border-0 !bg-transparent !text-v2-text-secondary"
                            aria-label={`対局 ${match.matchIndex} を削除`}
                            disabled={Boolean(deletingMatchId)}
                            onClick={(event) => {
                              event.stopPropagation();
                              onDelete(String(match.id));
                            }}
                          >
                            <Trash2 size={18} aria-hidden="true" />
                          </IconButton>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                <tr aria-hidden="true">
                  <td colSpan={players.length + 1 + (editable ? 1 : 0)}>
                    <div className="mt-1 border-t-2 border-v2-action-primary" />
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="py-3 font-normal">
                    合計
                  </th>
                  {players.map((player) => {
                    const total = matches.reduce(
                      (sum, match) =>
                        sum +
                        (match.results.find(
                          (item) =>
                            String(item.userId) === String(player.userId)
                        )?.point ?? 0),
                      0
                    );
                    return (
                      <td
                        key={String(player.userId)}
                        className={`whitespace-nowrap px-0.5 tabular-nums ${pointColor(total)}`}
                      >
                        {formatPoint(total)}
                      </td>
                    );
                  })}
                  {editable && <td />}
                </tr>
              </tbody>
            </Table>
          </div>
        )}
      </Panel>
      <MatchDetailsDialog
        match={selectedMatch}
        players={players}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
};
