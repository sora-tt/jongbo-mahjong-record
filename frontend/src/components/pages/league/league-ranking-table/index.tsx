import * as React from "react";

import clsx from "clsx";

import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeadCell,
  TableCell,
} from "@/components/ui/table";

import { useLeagueRankingTable } from "./hooks";

export const LeagueRankingTable: React.FC = () => {
  const { members } = useLeagueRankingTable();

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeadCell>順位</TableHeadCell>
          <TableHeadCell>プレイヤー</TableHeadCell>
          <TableHeadCell>総合pt</TableHeadCell>
          <TableHeadCell>1位</TableHeadCell>
          <TableHeadCell>2位</TableHeadCell>
          <TableHeadCell>3位</TableHeadCell>
          <TableHeadCell>4位</TableHeadCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {members.map((member) => (
          <TableRow key={member.rank} className="text-text-muted">
            <TableCell>{member.rank}</TableCell>
            <TableCell>{member.player.name}</TableCell>
            <TableCell
              className={clsx(
                "font-semibold",
                member.totalPoints >= 0 ? "text-blue-400" : "text-red-400"
              )}
            >
              {member.totalPoints.toFixed(1)}
            </TableCell>
            <TableCell>{member.numberOfEachOrder.first}</TableCell>
            <TableCell>{member.numberOfEachOrder.second}</TableCell>
            <TableCell>{member.numberOfEachOrder.third}</TableCell>
            <TableCell>{member.numberOfEachOrder.fourth}</TableCell>
          </TableRow>
        ))}

        {members.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={7}
              className="px-3 py-4 text-center text-gray-400"
            >
              まだ対局結果が登録されていません
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
