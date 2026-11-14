import * as React from "react";

import Link from "next/link";

import { SeasonNameField } from "@/features/season/ui/v2/season-name-field";

import { Panel } from "@/components/v2/ui/panel";

type Props = React.ComponentProps<typeof SeasonNameField> & {
  leagueName: string;
  leagueHref?: string;
};
export const SeasonIdentity = ({
  leagueName,
  leagueHref,
  ...inputProps
}: Props) => (
  <Panel className="space-y-4">
    <div>
      <p className="text-v2-caption text-v2-text-secondary">対象リーグ</p>
      {leagueHref ? (
        <Link
          href={leagueHref}
          className="mt-1 inline-block font-bold text-v2-text"
        >
          {leagueName}
        </Link>
      ) : (
        <p className="mt-1 font-bold">{leagueName}</p>
      )}
    </div>
    <SeasonNameField {...inputProps} />
  </Panel>
);
