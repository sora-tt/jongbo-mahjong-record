import * as React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "@/components/ui/table";

import type { toStandingRows } from "@/features/statistics/model/adapter";

type StandingRow = ReturnType<typeof toStandingRows>[number];

type Props = {
  rows: ReadonlyArray<StandingRow>;
};

const getTotalPointsClassName = (totalPoints: number) => {
  if (totalPoints > 0) return "font-semibold text-blue-500";
  if (totalPoints < 0) return "font-semibold text-red-500";
  return "font-semibold text-text-muted";
};

export const StandingsTable: React.FC<Props> = ({ rows }) => (
  <Table caption="順位表">
    <TableHead>
      <TableRow>
        <TableHeadCell>順位</TableHeadCell>
        <TableHeadCell>プレイヤー</TableHeadCell>
        <TableHeadCell>総合pt</TableHeadCell>
        <TableHeadCell>1位</TableHeadCell>
        <TableHeadCell>2位</TableHeadCell>
        <TableHeadCell>3位</TableHeadCell>
        <TableHeadCell>4位</TableHeadCell>
        <TableHeadCell>対局数</TableHeadCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {rows.length > 0 ? (
        rows.map((row) => (
          <TableRow key={String(row.userId)}>
            <TableCell>{row.rank}</TableCell>
            <TableCell>{row.userName}</TableCell>
            <TableCell className={getTotalPointsClassName(row.totalPoints)}>
              {row.totalPoints.toFixed(1)}
            </TableCell>
            <TableCell>{row.firstCount}</TableCell>
            <TableCell>{row.secondCount}</TableCell>
            <TableCell>{row.thirdCount}</TableCell>
            <TableCell>{row.fourthCount ?? "-"}</TableCell>
            <TableCell>{row.matchCount}</TableCell>
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell
            colSpan={8}
            className="px-3 py-4 text-center text-text-muted"
          >
            まだ対局結果が登録されていません
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
);
