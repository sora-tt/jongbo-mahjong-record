"use client";
import { useSeasonNew } from "@/features/season/hooks/use-season-new";
import { SeasonFormActions } from "@/features/season/ui/v2/season-form-actions";
import { SeasonIdentity } from "@/features/season/ui/v2/season-identity";
import { SeasonMembers } from "@/features/season/ui/v2/season-members";
import { SeasonMembersSection } from "@/features/season/ui/v2/season-members-section";

import { AppShell } from "@/components/v2/layout/app-shell";
import { PageLoading } from "@/components/v2/ui/page-loading";
import { Status } from "@/components/v2/ui/status";

const SeasonNewPage = () => {
  const {
    leagueId,
    leagueName,
    leagueMembers,
    selectedMembers,
    seasonName,
    loading,
    notFound,
    isSubmitting,
    error,
    handleMemberToggle,
    handleSeasonNameChange,
    handleSubmit,
  } = useSeasonNew("/v2");
  const backHref = leagueId ? `/v2/league/${leagueId}` : "/v2";
  if (loading) {
    return (
      <AppShell>
        <PageLoading label="シーズン作成画面を読み込んでいます…" />
      </AppShell>
    );
  }
  return (
    <AppShell>
      <main className="mx-auto flex max-w-[480px] flex-col gap-4 px-4 pb-10 pt-5">
        <h1 className="mb-1 text-center text-v2-display font-bold">
          シーズン作成
        </h1>
        {notFound ? (
          <Status message="リーグが見つかりません" />
        ) : (
          <>
            <SeasonIdentity
              leagueName={leagueName}
              placeholder="例: 2026 冬"
              value={seasonName}
              onChange={handleSeasonNameChange}
            />
            <SeasonMembersSection count={Object.keys(selectedMembers).length}>
              {leagueMembers.length ? (
                <SeasonMembers
                  members={leagueMembers}
                  selectedIds={Object.keys(selectedMembers)}
                  onToggle={handleMemberToggle}
                  disabled={isSubmitting}
                />
              ) : (
                <p className="text-v2-caption text-v2-text-secondary">
                  リーグメンバーがいません。
                </p>
              )}
            </SeasonMembersSection>
            {error && <Status message={error} />}
            <SeasonFormActions
              label="シーズンを作成"
              onSubmit={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || leagueMembers.length === 0}
              backHref={backHref}
            />
          </>
        )}
      </main>
    </AppShell>
  );
};
export default SeasonNewPage;
