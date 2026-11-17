import * as React from "react";

import { YAKUMAN_LABELS } from "@/lib/yakuman";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Table } from "@/components/ui/table";

import type { toMatchList } from "@/features/match/model/adapter";

type Match = ReturnType<typeof toMatchList>[number];
type Player = { userId: string; userName: string };
const winds: Record<string, string> = {
  east: "東",
  south: "南",
  west: "西",
  north: "北",
};

export const MatchDetailsDialog = ({
  match,
  players,
  onClose,
}: {
  match: Match | null;
  players: readonly Player[];
  onClose: () => void;
}) => {
  const ref = React.useRef<HTMLDialogElement>(null);
  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (match && !dialog.open) dialog.showModal();
    if (!match && dialog.open) dialog.close();
  }, [match]);
  const nameOf = (id: string) =>
    players.find((player) => String(player.userId) === String(id))?.userName ??
    "参加者";
  return (
    <Dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="match-detail-title"
      className="w-full"
    >
      {match && (
        <>
          <h2 id="match-detail-title" className="text-app-heading-2 font-bold">
            対局詳細 #{match.matchIndex}
          </h2>
          <p className="mt-2 text-center text-app-caption text-app-text-secondary">
            {new Date(match.playedAt).toLocaleString("ja-JP")}
          </p>
          <Table
            plain
            className="mt-5 text-center text-app-caption [&_td]:py-2 [&_th]:py-2"
          >
            <thead className="border-b border-app-border-subtle text-app-text-secondary">
              <tr>
                <th>席</th>
                <th>プレイヤー</th>
                <th>点数</th>
                <th>順位</th>
                <th>pt</th>
              </tr>
            </thead>
            <tbody>
              {match.results.map((result) => (
                <tr
                  key={String(result.userId)}
                  className="border-b border-app-border-subtle"
                >
                  <td>{winds[result.wind] ?? result.wind}</td>
                  <td>{result.userName}</td>
                  <td>{result.rawScore.toLocaleString("ja-JP")}</td>
                  <td>{result.rank}位</td>
                  <td>
                    {result.point > 0 ? "+" : ""}
                    {result.point.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="mt-4 space-y-1 text-app-caption text-app-text-secondary">
            <p>
              チョンボ：
              {match.chomboEvents.length
                ? match.chomboEvents
                    .map((event) => nameOf(event.offenderUserId))
                    .join("、")
                : "なし"}
            </p>
            <p>
              卓外供託：
              {match.offTableKyotakuCount
                ? `${match.offTableKyotakuCount}本`
                : "なし"}
            </p>
            <p>
              役満：
              {match.yakumanEvents.length
                ? match.yakumanEvents
                    .map(
                      (event) =>
                        `${nameOf(event.winnerUserId)}（${YAKUMAN_LABELS[event.kind]}）`
                    )
                    .join("、")
                : "なし"}
            </p>
          </div>
          <Button
            variant="secondary"
            fullWidth
            className="mt-6"
            onClick={() => ref.current?.close()}
          >
            閉じる
          </Button>
        </>
      )}
    </Dialog>
  );
};
