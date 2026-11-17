"use client";
import { useParams, useRouter } from "next/navigation";

import { deleteLeague } from "@/features/league/api";
import { useLeagueEdit } from "@/features/league/hooks/use-league-edit";
import { LeagueDeleteControl } from "@/features/league/ui/v2/league-delete-control";
import { LeagueForm } from "@/features/league/ui/v2/league-form";

import { AppShell } from "@/components/v2/layout/app-shell";
import { PageLoading } from "@/components/v2/ui/page-loading";
import { Status } from "@/components/v2/ui/status";

const EditLeaguePage = () => {
  const state = useLeagueEdit("/v2");
  const { leagueId } = useParams<{ leagueId: string }>();
  const router = useRouter();
  return (
    <AppShell title="リーグ編集" backHref={`/v2/league/${leagueId}`}>
      {state.loading ? (
        <PageLoading label="リーグ情報を読み込んでいます…" />
      ) : state.notFound ? (
        <div className="mx-auto max-w-[480px] p-4">
          <Status message="リーグが見つかりません" />
        </div>
      ) : state.error && !state.isLoaded ? (
        <div className="mx-auto max-w-[480px] p-4">
          <Status message={state.error} onRetry={state.retry} />
        </div>
      ) : (
        <LeagueForm
          state={state}
          ruleLocked={state.isRuleLocked}
          backHref={`/v2/league/${leagueId}`}
          submitLabel="変更を保存"
          showBackLink={false}
          footerAction={
            <LeagueDeleteControl
              disabled={state.isSubmitting}
              onDelete={() => deleteLeague(leagueId)}
              onDeleted={() => router.replace("/v2")}
              onAuthenticationError={() => router.replace("/v2/login")}
            />
          }
        />
      )}
    </AppShell>
  );
};
export default EditLeaguePage;
