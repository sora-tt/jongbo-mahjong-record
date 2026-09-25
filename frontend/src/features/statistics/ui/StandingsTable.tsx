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

export const StandingsTable: React.FC<Props> = ({ rows }) => (
  <Table caption="順位表">
    <TableHead>
      <TableRow>
        <TableHeadCell>順位</TableHeadCell>
        <TableHeadCell>プレイヤー</TableHeadCell>
        <TableHeadCell>総合pt</TableHeadCell>
        <TableHeadCell>対局数</TableHeadCell>
        <TableHeadCell>1位</TableHeadCell>
        <TableHeadCell>2位</TableHeadCell>
        <TableHeadCell>3位</TableHeadCell>
        <TableHeadCell>4位</TableHeadCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {rows.map((row) => (
        <TableRow key={String(row.userId)}>
          <TableCell>{row.rank}</TableCell>
          <TableCell>{row.userName}</TableCell>
          <TableCell>{row.totalPoints.toFixed(1)}</TableCell>
          <TableCell>{row.matchCount}</TableCell>
          <TableCell>{row.firstCount}</TableCell>
          <TableCell>{row.secondCount}</TableCell>
          <TableCell>{row.thirdCount}</TableCell>
          <TableCell>{row.fourthCount ?? "-"}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
