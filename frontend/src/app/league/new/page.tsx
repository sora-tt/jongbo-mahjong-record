"use client";
import { useLeagueNew } from "@/features/league/hooks/use-league-new";
import { LeagueForm } from "@/features/league/ui/league-form";

import { AppShell } from "@/components/layout/app-shell";

const NewLeaguePage = () => {
  const state = useLeagueNew();
  return (
    <AppShell title="リーグ作成" backHref="/">
      <LeagueForm
        state={state}
        creatorName={state.creatorName}
        disabled={state.isAuthLoading}
        backHref="/"
        submitLabel="リーグを作成"
        showBackLink={false}
      />
    </AppShell>
  );
};
export default NewLeaguePage;
