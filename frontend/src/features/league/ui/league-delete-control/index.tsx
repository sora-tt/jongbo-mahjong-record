import * as React from "react";

import { DeleteResourceControl } from "@/components/ui/delete-resource-control";

export const LeagueDeleteControl = (
  props: Omit<
    React.ComponentProps<typeof DeleteResourceControl>,
    "resourceName" | "description" | "uncertainMessage"
  >
) => (
  <DeleteResourceControl
    {...props}
    resourceName="リーグ"
    description="リーグ内のシーズンと対局記録も削除され、元に戻せません。参加者全員の成績に反映されます。"
    uncertainMessage="削除状況を確認できませんでした。ホーム画面からリーグの状態を確認してください。"
  />
);
