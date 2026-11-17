import * as React from "react";

import Link from "next/link";

import { SeasonNameField } from "@/features/season/ui/season-name-field";

import { Panel } from "@/components/ui/panel";

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
      <p className="text-app-caption text-app-text-secondary">対象リーグ</p>
      {leagueHref ? (
        <Link
          href={leagueHref}
          className="mt-1 inline-block font-bold text-app-text"
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
