// components/pages/daily-record/daily-record-table/index.tsx
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

import type { Match } from "@/types/domain/match";
import type { User } from "@/types/domain/user";

type DailyRecordTableMatch = {
  index: number;
  match: Match;
};

type Props = {
  players: User[];
  matches: DailyRecordTableMatch[];
  totals: number[];
};

const formatScore = (score: number | null | undefined) => {
  if (score === null || score === undefined) return "";
  if (score === 0) return "0.0pt";
  const sign = score > 0 ? "+" : "";
  return `${sign}${score.toFixed(1)}pt`;
};

const scoreClass = (score: number | null | undefined) => {
  if (score === null || score === undefined || score === 0) {
    return "text-text-muted";
  }
  return score > 0 ? "text-blue-500" : "text-red-500";
};

const WIND_ORDER = ["EAST", "SOUTH", "WEST", "NORTH"] as const;

export const DailyRecordTable: React.FC<Props> = ({
  players,
  matches,
  totals,
}) => {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeadCell className="w-12" />
          {players.map((p) => (
            <TableHeadCell key={p.id}>{p.name}</TableHeadCell>
          ))}
          <TableHeadCell />
        </TableRow>
      </TableHead>

      <TableBody>
        {matches.map(({ index: _idx, match }, rowIndex) => {
          const resultInput = match.results.matchResultInput;
          const resultArray = WIND_ORDER.map((w) => resultInput[w]);

          return (
            <TableRow key={match.id} className="text-text-muted">
              <TableCell className="font-semibold">{rowIndex + 1}</TableCell>

              {players.map((player) => {
                const resultForPlayer = resultArray.find(
                  (r) => r.player.id === player.id
                );
                const score = resultForPlayer?.score ?? null;

                return (
                  <TableCell key={player.id} className={scoreClass(score)}>
                    {formatScore(score)}
                  </TableCell>
                );
              })}

              <TableCell>
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <button className="p-1 rounded-full hover:bg-gray-100 hover:text-gray-700 transition-colors duration-150">
                    <Edit2 size={16} />
                  </button>
                  <button className="p-1 rounded-full hover:bg-gray-100 hover:text-red-500 transition-colors duration-150">
                    <Trash2 size={16} />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}

        {/* 合計行（背景は白のまま） */}
        <TableRow className="text-text-muted bg-white">
          <TableCell className="font-semibold">計</TableCell>
          {totals.map((total, idx) => (
            <TableCell
              key={players[idx].id}
              className={`font-semibold ${scoreClass(total)}`}
            >
              {formatScore(total)}
            </TableCell>
          ))}
          <TableCell />
        </TableRow>
      </TableBody>
    </Table>
  );
};
