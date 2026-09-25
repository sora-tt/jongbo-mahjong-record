import * as React from "react";

import { ChevronDown, ChevronUp, Edit2, Trash2 } from "lucide-react";

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
  matches: ReadonlyArray<MatchView>;
  expandedMatchId: string | null;
  deletingMatchId: string | null;
  onToggle: (matchId: string) => void;
  onEdit: (matchId: string) => void;
  onDelete: (matchId: string) => void;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export const MatchList: React.FC<Props> = ({
  matches,
  expandedMatchId,
  deletingMatchId,
  onToggle,
  onEdit,
  onDelete,
}) => {
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
          <TableHeadCell>局</TableHeadCell>
          <TableHeadCell>日時</TableHeadCell>
          <TableHeadCell>結果</TableHeadCell>
          <TableHeadCell>操作</TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {matches.map((match) => {
          const expanded = expandedMatchId === String(match.id);
          return (
            <React.Fragment key={String(match.id)}>
              <TableRow>
                <TableCell className="font-semibold">
                  #{match.matchIndex}
                </TableCell>
                <TableCell>{formatDate(match.playedAt)}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-brand-strong hover:underline"
                    onClick={() => onToggle(String(match.id))}
                    aria-expanded={expanded}
                  >
                    {match.results.map((result) => result.userName).join(" / ")}
                    {expanded ? (
                      <ChevronUp size={15} />
                    ) : (
                      <ChevronDown size={15} />
                    )}
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(String(match.id))}
                      disabled={Boolean(deletingMatchId)}
                      aria-label="対局結果を編集"
                    >
                      <Edit2 size={16} />
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
              {expanded ? (
                <TableRow className="bg-surface-muted">
                  <TableCell colSpan={4} className="text-left">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {match.results.map((result) => (
                        <div
                          key={String(result.userId)}
                          className="rounded-control bg-white p-3 text-sm"
                        >
                          <div className="font-semibold text-foreground">
                            {result.userName}（{result.wind}）
                          </div>
                          <div className="mt-1 text-text-muted">
                            素点：{result.rawScore.toLocaleString()}点 / 順位：
                            {result.rank}位 / point：{result.point}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </React.Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
};
