"use client";
import { useLeagueNew } from "@/features/league/hooks/use-league-new";
import { LeagueForm } from "@/features/league/ui/v2/league-form";

import { AppShell } from "@/components/v2/layout/app-shell";

const NewLeaguePage = () => {
  const state = useLeagueNew("/v2");
  return (
    <AppShell>
      <LeagueForm
        state={state}
        title="リーグ作成"
        creatorName={state.creatorName}
        disabled={state.isAuthLoading}
        backHref="/v2"
        submitLabel="リーグを作成"
      />
    </AppShell>
  );
};
export default NewLeaguePage;
