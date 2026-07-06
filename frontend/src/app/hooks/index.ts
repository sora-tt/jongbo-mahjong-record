import * as React from "react";

import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api/core";
import { fetchLeagues } from "@/lib/api/leagues";
import { createMe, fetchMe } from "@/lib/api/users";
import { getCurrentIdToken, getCurrentUser } from "@/lib/firebase/auth";

const getFallbackUsername = (email: string) =>
  email
    .split("@")[0]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");

const DEFAULT_ERROR_MESSAGE =
  "ホーム画面の取得に失敗しました。時間をおいて再度お試しください。";

export const useHome = () => {
  const router = useRouter();
  const [userId, setUserId] = React.useState("");
  const [userName, setUserName] = React.useState("");
  const [leagues, setLeagues] = React.useState<
    Awaited<ReturnType<typeof fetchLeagues>>
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
        setLeagues(joinedLeagues);
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
            const idToken = await getCurrentIdToken();
            const fbUser = await getCurrentUser();

            if (!idToken || !fbUser) {
              router.replace("/login");
              return;
            }

            const profile = await createMe(
              {
                name:
                  fbUser.displayName ?? fbUser.email?.split("@")[0] ?? "user",
                username: getFallbackUsername(
                  fbUser.email ?? fbUser.displayName ?? "user"
                ),
              },
              idToken
            );
            const joinedLeagues = await fetchLeagues();

            if (!isActive) {
              return;
            }

            setUserId(profile.id);
            setUserName(profile.name);
            setLeagues(joinedLeagues);
            return;
          } catch (repairError) {
            if (!isActive) {
              return;
            }

            setError(
              repairError instanceof Error
                ? repairError.message
                : DEFAULT_ERROR_MESSAGE
            );
            return;
          }
        }

        setError(
          loadError instanceof Error ? loadError.message : DEFAULT_ERROR_MESSAGE
        );
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
  }, [router]);

  const hasLeagues = leagues.length > 0;

  return {
    userId,
    userName,
    leagues,
    hasLeagues,
    isLoading,
    error,
  };
};
