import * as React from "react";

import { useRouter } from "next/navigation";

import { fetchLeagues } from "@/features/league/api";
import { toLeagueSummary } from "@/features/league/model/adapter";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";
import { createMe, fetchMe } from "@/lib/api/users";
import { getCurrentUser } from "@/lib/firebase/auth";

const getFallbackUsername = (email: string) =>
  email
    .split("@")[0]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");

const DEFAULT_ERROR_MESSAGE =
  "ホーム画面の取得に失敗しました。時間をおいて再度お試しください。";

type LeagueSummary = ReturnType<typeof toLeagueSummary>;

export const useHome = () => {
  const router = useRouter();
  const [userId, setUserId] = React.useState("");
  const [userName, setUserName] = React.useState("");
  const [leagues, setLeagues] = React.useState<LeagueSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  React.useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const me = await fetchMe();
        const joinedLeagues = await fetchLeagues();

        if (!isActive) {
          return;
        }

        setUserId(me.id);
        setUserName(me.name);
        setLeagues(joinedLeagues.map(toLeagueSummary));
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace("/login");
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 404) {
          try {
            const fbUser = await getCurrentUser();

            if (!fbUser) {
              router.replace("/login");
              return;
            }

            const profile = await createMe({
              name: fbUser.displayName ?? fbUser.email?.split("@")[0] ?? "user",
              username: getFallbackUsername(
                fbUser.email ?? fbUser.displayName ?? "user"
              ),
            });
            const joinedLeagues = await fetchLeagues();

            if (!isActive) {
              return;
            }

            setUserId(profile.id);
            setUserName(profile.name);
            setLeagues(joinedLeagues.map(toLeagueSummary));
            return;
          } catch (repairError) {
            if (!isActive) {
              return;
            }

            setError(getApiErrorMessage(repairError, DEFAULT_ERROR_MESSAGE));
            return;
          }
        }

        setError(getApiErrorMessage(loadError, DEFAULT_ERROR_MESSAGE));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [retryCount, router]);

  const retry = React.useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  const hasLeagues = leagues.length > 0;

  return {
    userId,
    userName,
    leagues,
    hasLeagues,
    isLoading,
    error,
    retry,
  };
};
