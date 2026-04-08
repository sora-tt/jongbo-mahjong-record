import * as React from "react";

import { Edit2, Trash2 } from "lucide-react";

import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeadCell,
  TableCell,
} from "@/components/ui/table";

import { useDailyRecordTable } from "./hooks";

const WIND_ORDER = ["EAST", "SOUTH", "WEST", "NORTH"] as const;

const formatScore = ({ score }: { score: number | null | undefined }) => {
  if (score === null || score === undefined) return "";
  if (score === 0) return "0.0pt";
  const sign = score > 0 ? "+" : "";
  return `${sign}${score.toFixed(1)}pt`;
};

const scoreClass = ({ score }: { score: number | null | undefined }) => {
  if (score === null || score === undefined || score === 0) {
    return "text-text-muted";
  }
  return score > 0 ? "text-blue-500" : "text-red-500";
};

export const DailyRecordTable: React.FC = () => {
  const { players, matches, totals } = useDailyRecordTable();

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeadCell className="w-12">
            <span className="sr-only">#</span>
          </TableHeadCell>
          {players.map((p) => (
            <TableHeadCell key={p.userId}>{p.name}</TableHeadCell>
          ))}
          <TableHeadCell>
            <span className="sr-only">操作</span>
          </TableHeadCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {matches.map((match, rowIndex) => {
          const resultInput = match.results.matchResultInput;
          const resultArray = WIND_ORDER.map((w) => resultInput[w]);

          return (
            <TableRow key={match.matchId} className="text-text-muted">
              <TableCell className="font-semibold">{rowIndex + 1}</TableCell>

              {players.map((player) => {
                const resultForPlayer = resultArray.find(
                  (r) => r.player.userId === player.userId
                );
                const score = resultForPlayer?.score ?? null;

                return (
                  <TableCell
                    key={player.userId}
                    className={scoreClass({ score })}
                  >
                    {formatScore({ score })}
                  </TableCell>
                );
              })}

              <TableCell>
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <button
                    type="button"
                    aria-label="対局結果を編集"
                    className="p-1 rounded-full hover:bg-gray-100 hover:text-gray-700 transition-colors duration-150"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="対局結果を削除"
                    className="p-1 rounded-full hover:bg-gray-100 hover:text-red-500 transition-colors duration-150"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}

        <TableRow className="border-t-2 border-brand-500 text-text-muted">
          <TableCell className="font-semibold">計</TableCell>
          {players.map((player) => {
            const total = totals[player.userId] ?? null;

            return (
              <TableCell
                key={player.userId}
                className={`font-semibold ${scoreClass({ score: total })}`}
              >
                {formatScore({ score: total })}
              </TableCell>
            );
          })}
          <TableCell />
        </TableRow>
      </TableBody>
    </Table>
  );
};
