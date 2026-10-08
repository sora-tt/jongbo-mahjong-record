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
      console.info("[auth-debug]", "home:load-start", { retryCount });
      setIsLoading(true);
      setError(null);

      try {
        const me = await fetchMe();
        const joinedLeagues = await fetchLeagues();

        console.info("[auth-debug]", "home:load-success", {
          userId: me.id,
          leagues: joinedLeagues.length,
        });

        if (!isActive) {
          return;
        }

        setUserId(me.id);
        setUserName(me.name);
        setLeagues(joinedLeagues.map(toLeagueSummary));
      } catch (loadError) {
        console.error("[auth-debug]", "home:load-error", {
          error:
            loadError instanceof Error
              ? {
                  name: loadError.name,
                  message: loadError.message,
                }
              : loadError,
          status: loadError instanceof ApiError ? loadError.status : null,
          code: loadError instanceof ApiError ? loadError.code : null,
        });

        if (!isActive) {
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 401) {
          console.warn("[auth-debug]", "home:redirect-login", {
            reason: "status 401",
          });
          router.replace("/login");
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 404) {
          try {
            const fbUser = await getCurrentUser();

            if (!fbUser) {
              console.warn("[auth-debug]", "home:redirect-login", {
                reason: "status 404 and no firebase user",
              });
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

            console.info("[auth-debug]", "home:repair-success", {
              userId: profile.id,
              leagues: joinedLeagues.length,
            });

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
