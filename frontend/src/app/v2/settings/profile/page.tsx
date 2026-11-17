"use client";

import { useRouter } from "next/navigation";

import { useProfile } from "@/features/settings/hooks/use-profile";
import { ProfileForm } from "@/features/settings/ui/v2/profile-form";

import { AppShell } from "@/components/v2/layout/app-shell";
import { PageLoading } from "@/components/v2/ui/page-loading";
import { Status } from "@/components/v2/ui/status";

import type { UpdateMeInput } from "@/lib/api/contracts";

const ProfilePage = () => {
  const { profile, loading, error, retry, save, saving, saveError } =
    useProfile();
  const router = useRouter();
  const handleSave = async (input: UpdateMeInput) => {
    if (await save(input)) router.push("/v2/settings");
  };

  return (
    <AppShell backHref="/v2/settings" title="プロフィール編集">
      {loading ? (
        <PageLoading label="プロフィールを読み込んでいます" />
      ) : (
        <main className="mx-auto w-full max-w-xl px-4 pb-10 pt-6">
          {error ? (
            <Status message={error} onRetry={retry} />
          ) : (
            profile && (
              <ProfileForm
                profile={profile}
                onSave={handleSave}
                saving={saving}
                error={saveError}
              />
            )
          )}
        </main>
      )}
    </AppShell>
  );
};

export default ProfilePage;
