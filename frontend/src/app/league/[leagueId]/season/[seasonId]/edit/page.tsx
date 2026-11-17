"use client";
import { useRouter } from "next/navigation";

import { deleteSeason, fetchSeasonDetail } from "@/features/season/api";
import { useSeasonEdit } from "@/features/season/hooks/use-season-edit";
import { SeasonFormActions } from "@/features/season/ui/season-form-actions";
import { SeasonIdentity } from "@/features/season/ui/season-identity";
import { SeasonMembers } from "@/features/season/ui/season-members";
import { SeasonMembersSection } from "@/features/season/ui/season-members-section";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { DeleteResourceControl } from "@/components/ui/delete-resource-control";
import { PageLoading } from "@/components/ui/page-loading";
import { Panel } from "@/components/ui/panel";
import { Status } from "@/components/ui/status";

const SeasonEditPage = () => {
  const state = useSeasonEdit("", true);
  const router = useRouter();
  const {
    leagueId,
    seasonId,
    leagueName,
    seasonName,
    status,
    members,
    candidateMembers,
    selectedMembers,
    isLoading,
    areLeagueMembersLoading,
    leagueMembersError,
    isLoaded,
    notFound,
    isSubmitting,
    error,
    setSeasonName,
    setStatus,
    handleMemberToggle,
    handleSubmit,
    retry,
    retryLeagueMembers,
  } = state;
  const backHref =
    leagueId && seasonId ? `/league/${leagueId}/season/${seasonId}` : "/";
  if (isLoading) {
    return (
      <AppShell title="シーズン編集" backHref={backHref}>
        <PageLoading label="シーズン情報を読み込んでいます…" />
      </AppShell>
    );
  }
  return (
    <AppShell title="シーズン編集" backHref={backHref}>
      <main className="mx-auto flex max-w-[480px] flex-col gap-4 px-4 pb-10 pt-5">
        {notFound ? (
          <Status message="シーズンが見つかりません" />
        ) : error && !isLoaded ? (
          <Status message={error} onRetry={retry} />
        ) : (
          <>
            <SeasonIdentity
              leagueName={leagueName}
              leagueHref={`/league/${leagueId}`}
              value={seasonName}
              onChange={(event) => setSeasonName(event.target.value)}
              required
            />
            <SeasonMembersSection
              count={members.length + Object.keys(selectedMembers).length}
            >
              <p className="mb-2 text-app-caption text-app-text-secondary">
                既存の参加者を維持したまま、リーグ参加者を追加できます。
              </p>
              {areLeagueMembersLoading ? (
                <Status loading message="リーグ参加者を読み込んでいます…" />
              ) : leagueMembersError ? (
                <Status
                  message={leagueMembersError}
                  onRetry={retryLeagueMembers}
                />
              ) : (
                <SeasonMembers
                  members={[...members, ...candidateMembers]}
                  lockedIds={members.map((member) => member.userId)}
                  selectedIds={Object.keys(selectedMembers)}
                  onToggle={handleMemberToggle}
                  disabled={isSubmitting}
                />
              )}
            </SeasonMembersSection>
            <Panel>
              <p className="mb-2 text-app-caption text-app-text-secondary">
                状態
              </p>
              <div className="flex gap-2">
                {(
                  [
                    { value: "active", label: "進行中" },
                    { value: "archived", label: "終了" },
                  ] as const
                ).map((item) => (
                  <Button
                    key={item.value}
                    type="button"
                    variant="selection"
                    size="sm"
                    selected={status === item.value}
                    disabled={isSubmitting}
                    onClick={() => setStatus(item.value)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </Panel>
            {error && <Status message={error} />}
            <SeasonFormActions
              label="変更を保存"
              onSubmit={handleSubmit}
              loading={isSubmitting}
              backHref={backHref}
              showBackLink={false}
              footerAction={
                <DeleteResourceControl
                  resourceName="シーズン"
                  description="シーズン内の対局記録も削除され、元に戻せません。参加者全員の成績に反映されます。"
                  uncertainMessage="削除状況を確認できませんでした。リーグ画面からシーズンの状態を確認してください。"
                  disabled={isSubmitting || !leagueId || !seasonId}
                  onDelete={() => deleteSeason(leagueId, seasonId)}
                  onVerify={() =>
                    fetchSeasonDetail(leagueId, seasonId, { fresh: true })
                  }
                  onDeleted={() => router.replace(`/league/${leagueId}`)}
                  onAuthenticationError={() => router.replace("/login")}
                />
              }
            />
          </>
        )}
      </main>
    </AppShell>
  );
};
export default SeasonEditPage;
