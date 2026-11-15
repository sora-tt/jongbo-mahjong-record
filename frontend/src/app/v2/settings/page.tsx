"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { useProfile } from "@/features/settings/hooks/use-profile";
import { AccountSettings } from "@/features/settings/ui/v2/account-settings";
import { ProfileCard } from "@/features/settings/ui/v2/profile-card";
import { useAuth } from "@/providers/auth-provider";

import { AppShell } from "@/components/v2/layout/app-shell";
import { Button } from "@/components/v2/ui/button";
import { PageLoading } from "@/components/v2/ui/page-loading";
import { Status } from "@/components/v2/ui/status";

const SettingsPage = () => {
  const { profile, loading, error, retry } = useProfile();
  const { logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [logoutError, setLogoutError] = React.useState("");
  const loggingOutRef = React.useRef(false);

  const handleLogout = async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    setLoggingOut(true);
    setLogoutError("");
    try {
      await logout();
      router.replace("/v2/login");
    } catch {
      setLogoutError("ログアウトできませんでした。もう一度お試しください。");
    } finally {
      loggingOutRef.current = false;
      setLoggingOut(false);
    }
  };

  return (
    <AppShell bottomNav activeNav="settings">
      {loading ? (
        <PageLoading label="設定を読み込んでいます" bottomNav />
      ) : (
        <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-6">
          <h1 className="mb-6 text-center text-v2-heading-2 font-bold">設定</h1>
          {error ? (
            <Status message={error} onRetry={retry} />
          ) : (
            profile && (
              <div className="space-y-7">
                <ProfileCard profile={profile} />
                <AccountSettings email={profile.email} />
                {logoutError && <Status message={logoutError} />}
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="secondary"
                    loading={loggingOut}
                    onClick={handleLogout}
                    className="w-full max-w-[310px]"
                  >
                    ログアウト
                  </Button>
                </div>
              </div>
            )
          )}
        </main>
      )}
    </AppShell>
  );
};

export default SettingsPage;
