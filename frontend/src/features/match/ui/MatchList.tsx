import * as React from "react";

import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "@/components/ui/table";

import type { toMatchList } from "@/features/match/model/adapter";

type MatchView = ReturnType<typeof toMatchList>[number];

type Props = {
  players: ReadonlyArray<{
    userId: string;
    userName: string;
  }>;
  matches: ReadonlyArray<MatchView>;
  deletingMatchId: string | null;
  onEdit: (matchId: string) => void;
  onDelete: (matchId: string) => void;
};

export const MatchList: React.FC<Props> = ({
  players,
  matches,
  deletingMatchId,
  onEdit,
  onDelete,
}) => {
  const totalPointsByPlayer = players.map((player) => ({
    userId: String(player.userId),
    point: matches.reduce((total, match) => {
      const result = match.results.find(
        (candidate) => String(candidate.userId) === String(player.userId)
      );
      return total + (result?.point ?? 0);
    }, 0),
  }));

  const formatPoint = (point: number) =>
    `${point > 0 ? "+" : ""}${point.toFixed(1)}pt`;

  const getPointClassName = (point: number) => {
    if (point > 0) return "text-blue-500";
    if (point < 0) return "text-red-500";
    return "text-text-muted";
  };

  if (matches.length === 0) {
    return (
      <EmptyState
        title="まだ対局がありません"
        description="参加者と点数を入力して、最初の対局を記録してください。"
      />
    );
  }

  return (
    <Table caption="Sessionの対局結果">
      <TableHead>
        <TableRow>
          <TableHeadCell className="w-10" />
          {players.map((player) => (
            <TableHeadCell key={String(player.userId)}>
              {player.userName}
            </TableHeadCell>
          ))}
          <TableHeadCell className="w-16" />
        </TableRow>
      </TableHead>
      <TableBody>
        {matches.map((match) => (
          <TableRow key={String(match.id)}>
            <TableCell className="font-semibold text-text-muted">
              #{match.matchIndex}
            </TableCell>
            {players.map((player) => {
              const result = match.results.find(
                (candidate) =>
                  String(candidate.userId) === String(player.userId)
              );

              return (
                <TableCell key={String(player.userId)}>
                  {result ? (
                    <span
                      className={`font-medium ${getPointClassName(result.point)}`}
                    >
                      {formatPoint(result.point)}
                    </span>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </TableCell>
              );
            })}
            <TableCell>
              <div className="flex justify-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(String(match.id))}
                  disabled={Boolean(deletingMatchId)}
                  aria-label="対局結果を編集"
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(String(match.id))}
                  disabled={Boolean(deletingMatchId)}
                  aria-label="対局結果を削除"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        <TableRow className="border-t-2 border-brand-500">
          <TableCell className="font-semibold text-foreground">計</TableCell>
          {totalPointsByPlayer.map((total) => (
            <TableCell
              key={total.userId}
              className={`font-semibold ${getPointClassName(total.point)}`}
            >
              {formatPoint(total.point)}
            </TableCell>
          ))}
          <TableCell />
        </TableRow>
      </TableBody>
    </Table>
  );
};
